import type { Role } from "@prisma/client";

export type Permission =
  | "dashboard.view" | "inventory.view" | "inventory.manage"
  | "pos.use" | "sales.view" | "sales.refund" | "sales.void"
  | "purchases.manage" | "customers.manage" | "suppliers.manage"
  | "accounting.view" | "accounting.manage" | "expenses.manage"
  | "hr.manage" | "payroll.manage" | "branches.manage"
  | "reports.view" | "users.manage" | "settings.manage" | "audit.view";

const ALL: Permission[] = [
  "dashboard.view","inventory.view","inventory.manage","pos.use","sales.view","sales.refund","sales.void",
  "purchases.manage","customers.manage","suppliers.manage","accounting.view","accounting.manage",
  "expenses.manage","hr.manage","payroll.manage","branches.manage","reports.view","users.manage",
  "settings.manage","audit.view",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: ALL,
  MANAGER: ALL.filter((p) => !["users.manage", "settings.manage", "payroll.manage"].includes(p)),
  CASHIER: ["dashboard.view", "pos.use", "sales.view", "inventory.view", "customers.manage"],
  ACCOUNTANT: ["dashboard.view", "accounting.view", "accounting.manage", "expenses.manage", "reports.view", "sales.view", "payroll.manage"],
  HR_MANAGER: ["dashboard.view", "hr.manage", "payroll.manage"],
  STOCK_KEEPER: ["dashboard.view", "inventory.view", "inventory.manage", "purchases.manage", "suppliers.manage"],
};

export const can = (role: Role, perm: Permission) => ROLE_PERMISSIONS[role].includes(perm);
