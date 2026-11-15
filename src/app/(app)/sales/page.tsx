import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireContext } from "@/server/context";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-xl border border-line bg-surface" />}>
      <SalesContent />
    </Suspense>
  );
}

async function SalesContent() {
  const ctx = await requireContext("sales.view");
  const sales = await db.sale.findMany({
    where: {
      businessId: ctx.businessId,
      ...(ctx.branchId ? { branchId: ctx.branchId } : {}),
    },
    include: { customer: { select: { name: true } }, branch: { select: { name: true } }, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const business = await db.business.findUniqueOrThrow({
    where: { id: ctx.businessId }, select: { baseCurrency: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Sales</h1><p className="mt-1 text-sm text-muted">Latest 100 sales for your business.</p></div>
        <Link href="/pos" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink">New sale</Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {sales.length === 0 ? (
          <div className="p-10 text-center"><p className="font-medium">No sales yet</p><p className="mt-1 text-sm text-muted">Your completed POS transactions will appear here.</p><Link href="/pos" className="mt-4 inline-block text-sm font-semibold text-brand">Open Point of sale</Link></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Branch</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Paid</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Date</th></tr></thead>
              <tbody className="divide-y divide-line">
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{sale.number}</td>
                    <td className="px-4 py-3">{sale.customer?.name ?? "Walk-in"}</td>
                    <td className="px-4 py-3">{sale.branch.name}</td>
                    <td className="px-4 py-3 num">{sale._count.items}</td>
                    <td className="whitespace-nowrap px-4 py-3 num">{money(Number(sale.total), business.baseCurrency)}</td>
                    <td className="whitespace-nowrap px-4 py-3 num">{money(Number(sale.paid), business.baseCurrency)}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-surface-2 px-2 py-1 text-xs">{sale.paymentStatus.toLowerCase()}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(sale.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
