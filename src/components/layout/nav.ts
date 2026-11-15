import { LayoutDashboard, Boxes, ShoppingCart, Receipt, Truck, Users, Landmark, Wallet, UserCog, Building2, BarChart3, Settings, ScrollText, ShieldCheck } from "lucide-react";
import type { Permission } from "@/lib/permissions";

export const NAV: { href: string; label: string; icon: typeof Boxes; perm: Permission }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard.view" },
  { href: "/pos", label: "Point of sale", icon: ShoppingCart, perm: "pos.use" },
  { href: "/sales", label: "Sales", icon: Receipt, perm: "sales.view" },
  { href: "/inventory", label: "Inventory", icon: Boxes, perm: "inventory.view" },
  { href: "/purchases", label: "Purchases", icon: Truck, perm: "purchases.manage" },
  { href: "/customers", label: "Customers", icon: Users, perm: "customers.manage" },
  { href: "/suppliers", label: "Suppliers", icon: Building2, perm: "suppliers.manage" },
  { href: "/expenses", label: "Expenses", icon: Wallet, perm: "expenses.manage" },
  { href: "/accounting", label: "Accounting", icon: Landmark, perm: "accounting.view" },
  { href: "/hr", label: "Employees & payroll", icon: UserCog, perm: "hr.manage" },
  { href: "/reports", label: "Reports", icon: BarChart3, perm: "reports.view" },
  { href: "/users", label: "Team & permissions", icon: ShieldCheck, perm: "users.manage" },
  { href: "/audit", label: "Activity log", icon: ScrollText, perm: "audit.view" },
  { href: "/settings", label: "Settings", icon: Settings, perm: "settings.manage" },
];
