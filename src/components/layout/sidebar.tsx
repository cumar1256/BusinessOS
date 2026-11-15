"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NAV } from "./nav";
import { logoutAction } from "@/server/auth-actions";

type Item = { href: string; label: string };

export function Shell({ items, business, user, children }: {
  items: Item[]; business: string; user: string; children: React.ReactNode;
}) {
  const path = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const icons = Object.fromEntries(NAV.map((n) => [n.href, n.icon]));

  useEffect(() => {
    setMounted(true);
  }, []);

  const nav = (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
      {items.map((i) => {
        const Icon = icons[i.href];
        const active = path === i.href || path.startsWith(i.href + "/");
        return (
          <Link key={i.href} href={i.href} onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${active ? "bg-brand-soft font-semibold text-brand" : "text-muted hover:bg-surface-2 hover:text-ink"}`}>
            <Icon size={17} aria-hidden /> {i.label}
          </Link>
        );
      })}
    </nav>
  );

  const side = (
    <div className="flex h-full flex-col gap-4 py-4">
      <div className="px-6"><p className="truncate text-base font-bold tracking-tight">{business}</p><p className="text-xs text-muted">BusinessOS</p></div>
      {nav}
      <div className="flex items-center justify-between gap-2 border-t border-line px-4 pt-3">
        <span className="truncate text-sm text-muted">{user}</span>
        <div className="flex gap-1">
          <button aria-label="Toggle dark mode" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="grid size-8 place-items-center rounded-md hover:bg-surface-2">
            {mounted ? (resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />) : <span className="size-4" aria-hidden="true" />}
          </button>
          <form action={logoutAction}><button aria-label="Sign out" className="grid size-8 place-items-center rounded-md hover:bg-surface-2"><LogOut size={16} /></button></form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-surface lg:block">{side}</aside>
      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <p className="font-bold">{business}</p>
        <button aria-label="Open menu" onClick={() => setOpen(true)}><Menu /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 bg-surface"><button aria-label="Close" className="absolute right-3 top-3" onClick={() => setOpen(false)}><X size={18} /></button>{side}</div>
        </div>
      )}
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
