import { Suspense } from "react";
import { requireContext } from "@/server/context";
import { db } from "@/lib/db";

// Keep request-specific session and database reads inside this streamed boundary.
export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const ctx = await requireContext("dashboard.view");
  const where = { businessId: ctx.businessId };
  const [products, customers, branches] = await Promise.all([
    db.product.count({ where }), db.customer.count({ where }), db.branch.count({ where }),
  ]);
  const stats = [["Products", products], ["Customers", customers], ["Branches", branches]];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome, {ctx.userName.split(" ")[0]}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-surface p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="num mt-1 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <p className="max-w-prose text-sm text-muted">Add your first products in Inventory to start selling. Sales, stock and finances will appear here as you work.</p>
    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-8 w-56 animate-pulse rounded bg-surface-2" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-xl border border-line bg-surface" />
        ))}
      </div>
      <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
    </div>
  );
}
