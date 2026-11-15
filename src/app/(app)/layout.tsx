import { Suspense } from "react";
import { requireContext } from "@/server/context";
import { can } from "@/lib/permissions";
import { NAV } from "@/components/layout/nav";
import { Shell } from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppShellFallback />}>
      <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
    </Suspense>
  );
}

async function AuthenticatedAppShell({ children }: { children: React.ReactNode }) {
  const ctx = await requireContext(); // redirects to /login when unauthenticated
  const items = NAV.filter((n) => can(ctx.role, n.perm)).map(({ href, label }) => ({ href, label }));

  return <Shell items={items} business={ctx.business.name} user={ctx.userName}>{children}</Shell>;
}

function AppShellFallback() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_1fr]" aria-busy="true">
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-surface lg:block">
        <div className="space-y-6 px-6 py-6">
          <div className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-20 animate-pulse rounded bg-surface-2" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-8 animate-pulse rounded-lg bg-surface-2" />
            ))}
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="border-b border-line bg-surface px-4 py-3 lg:hidden">
          <div className="h-5 w-28 animate-pulse rounded bg-surface-2" />
        </header>
        <main className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="h-8 w-48 animate-pulse rounded bg-surface-2" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-xl border border-line bg-surface" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
