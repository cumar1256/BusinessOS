import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireContext } from "@/server/context";
import { POSTerminal } from "./pos-terminal";

export default function POSPage() {
  return (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-xl border border-line bg-surface" />}>
      <POSContent />
    </Suspense>
  );
}

async function POSContent() {
  const ctx = await requireContext("pos.use");
  const branch = ctx.branchId
    ? await db.branch.findFirst({ where: { id: ctx.branchId, businessId: ctx.businessId, active: true } })
    : await db.branch.findFirst({ where: { businessId: ctx.businessId, active: true }, orderBy: { isMain: "desc" } });
  if (!branch) {
    return <div className="rounded-xl border border-line bg-surface p-6"><h1 className="text-xl font-semibold">Point of sale</h1><p className="mt-2 text-sm text-muted">No active branch found. Add a branch before making sales.</p></div>;
  }

  const [products, stockRows, customers, paymentMethods, business] = await Promise.all([
    db.product.findMany({
      where: { businessId: ctx.businessId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, salePrice: true, trackStock: true },
    }),
    db.stockMovement.groupBy({
      by: ["productId"],
      where: { businessId: ctx.businessId, branchId: branch.id },
      _sum: { quantity: true },
    }),
    db.customer.findMany({ where: { businessId: ctx.businessId }, orderBy: { name: "asc" }, select: { id: true, name: true, phone: true } }),
    db.paymentMethod.findMany({ where: { businessId: ctx.businessId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.business.findUniqueOrThrow({ where: { id: ctx.businessId }, select: { baseCurrency: true } }),
  ]);
  const stock = new Map(stockRows.map((row) => [row.productId, row._sum.quantity ?? 0]));
  const safeProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    price: Number(product.salePrice),
    trackStock: product.trackStock,
    stock: stock.get(product.id) ?? 0,
  }));

  return <POSTerminal
    products={safeProducts}
    customers={customers}
    paymentMethods={paymentMethods}
    currency={business.baseCurrency}
    branchName={branch.name}
  />;
}
