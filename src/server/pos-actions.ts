"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireContext } from "@/server/context";
import { audit } from "@/server/audit";
import { postJournal } from "@/server/ledger";

const saleInput = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive().max(100000),
  })).min(1).max(100),
  customerId: z.string().optional(),
  paid: z.number().finite().min(0),
  paymentMethodId: z.string().optional(),
});

export type POSActionState = { error?: string };

export async function createSaleAction(
  _previous: POSActionState,
  formData: FormData,
): Promise<POSActionState> {
  const ctx = await requireContext("pos.use");
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "Cart data is invalid. Please refresh and try again." };
  }
  const parsed = saleInput.safeParse(raw);
  if (!parsed.success) return { error: "Check the cart quantities and payment amount." };

  const input = parsed.data;
  const branch = ctx.branchId
    ? await db.branch.findFirst({ where: { id: ctx.branchId, businessId: ctx.businessId, active: true } })
    : await db.branch.findFirst({ where: { businessId: ctx.businessId, active: true }, orderBy: { isMain: "desc" } });
  if (!branch) return { error: "No active branch is available. Add a branch in Settings first." };

  try {
    const saleId = await db.$transaction(async (tx) => {
      const business = await tx.business.findUniqueOrThrow({ where: { id: ctx.businessId } });
      const currency = business.baseCurrency;
      const customer = input.customerId
        ? await tx.customer.findFirst({ where: { id: input.customerId, businessId: ctx.businessId } })
        : null;
      if (input.customerId && !customer) throw new Error("Selected customer was not found.");

      const ids = [...new Set(input.items.map((item) => item.productId))];
      if (ids.length !== input.items.length) throw new Error("A product appears more than once in the cart.");
      const products = await tx.product.findMany({
        where: { id: { in: ids }, businessId: ctx.businessId, active: true },
      });
      if (products.length !== ids.length) throw new Error("One or more products are unavailable. Refresh the page.");

      const byId = new Map(products.map((product) => [product.id, product]));
      let subtotal = 0;
      let cogs = 0;
      const saleItems = input.items.map((item) => {
        const product = byId.get(item.productId)!;
        const price = Number(product.salePrice);
        const cost = Number(product.costPrice);
        subtotal += price * item.quantity;
        cogs += cost * item.quantity;
        return { productId: product.id, quantity: item.quantity, unitPrice: price, unitCost: cost };
      });
      const total = Number(subtotal.toFixed(2));
      const paid = Number(input.paid.toFixed(2));
      if (paid > total) throw new Error("Payment cannot be greater than the sale total.");

      for (const item of input.items) {
        const product = byId.get(item.productId)!;
        if (!product.trackStock) continue;
        const stock = await tx.stockMovement.aggregate({
          where: { businessId: ctx.businessId, branchId: branch.id, productId: product.id },
          _sum: { quantity: true },
        });
        const onHand = stock._sum.quantity ?? 0;
        if (item.quantity > onHand) {
          throw new Error(`Not enough stock for ${product.name}. Available: ${onHand}.`);
        }
      }

      let paymentAccountCode = "1000";
      if (paid > 0) {
        if (!input.paymentMethodId) throw new Error("Choose a payment method.");
        const method = await tx.paymentMethod.findFirst({
          where: { id: input.paymentMethodId, businessId: ctx.businessId, active: true },
          include: { },
        });
        if (!method) throw new Error("Selected payment method is unavailable.");
        if (method.accountId) {
          const account = await tx.account.findFirst({
            where: { id: method.accountId, businessId: ctx.businessId },
          });
          if (account) paymentAccountCode = account.code;
        }
      }

      const counter = await tx.counter.upsert({
        where: { businessId_key: { businessId: ctx.businessId, key: "invoice" } },
        create: { businessId: ctx.businessId, key: "invoice", value: 1 },
        update: { value: { increment: 1 } },
      });
      const number = `${business.invoicePrefix}-${String(counter.value).padStart(6, "0")}`;
      const paymentStatus = paid >= total ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";

      const sale = await tx.sale.create({
        data: {
          businessId: ctx.businessId,
          branchId: branch.id,
          number,
          customerId: customer?.id,
          currency,
          subtotal: total,
          total,
          paid,
          cogs,
          paymentStatus,
          createdById: ctx.userId,
          items: { create: saleItems },
        },
      });

      await tx.stockMovement.createMany({
        data: input.items.flatMap((item) => {
          const product = byId.get(item.productId)!;
          return product.trackStock ? [{
            businessId: ctx.businessId,
            branchId: branch.id,
            productId: product.id,
            type: "SALE" as const,
            quantity: -item.quantity,
            unitCost: product.costPrice,
            refType: "Sale",
            refId: sale.id,
            createdById: ctx.userId,
          }] : [];
        }),
      });

      if (paid > 0) {
        await tx.payment.create({
          data: {
            businessId: ctx.businessId,
            saleId: sale.id,
            methodId: input.paymentMethodId!,
            amount: paid,
            currency,
            direction: "IN",
          },
        });
      }

      const outstanding = Number((total - paid).toFixed(2));
      const journalLines = [
        ...(paid > 0 ? [{ accountCode: paymentAccountCode, debit: paid }] : []),
        ...(outstanding > 0 ? [{ accountCode: "1100", debit: outstanding, partyType: customer ? "Customer" : undefined, partyId: customer?.id }] : []),
        { accountCode: "4000", credit: total },
        ...(cogs > 0 ? [{ accountCode: "5000", debit: cogs }, { accountCode: "1200", credit: cogs }] : []),
      ];
      await postJournal(tx, {
        businessId: ctx.businessId,
        memo: `POS sale ${number}`,
        refType: "Sale",
        refId: sale.id,
        lines: journalLines,
      });
      await audit(ctx, "sale.create", "Sale", sale.id, { number, total, paid, currency }, tx);
      return sale.id;
    }, { isolationLevel: "Serializable" });

    revalidatePath("/dashboard");
    revalidatePath("/pos");
    revalidatePath("/sales");
    revalidatePath("/inventory");
    redirect(`/sales?created=${saleId}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return { error: error instanceof Error ? error.message : "Unable to complete the sale." };
  }
}
