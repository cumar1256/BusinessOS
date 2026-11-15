import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { readSession } from "@/lib/session";
import { can, type Permission } from "@/lib/permissions";

/**
 * The ONLY way server code learns who the caller is and which tenant they act in.
 * Membership is re-checked against the database on every call (JWT is never trusted
 * for role), so removing a user or changing a role takes effect immediately.
 */
export async function getContext() {
  const s = await readSession();
  if (!s) return null;
  const m = await db.membership.findUnique({
    where: { userId_businessId: { userId: s.userId, businessId: s.businessId } },
    include: { user: true, business: true },
  });
  if (!m || !m.user.active) return null;
  return {
    userId: m.userId, userName: m.user.name,
    businessId: m.businessId, business: m.business,
    role: m.role, branchId: m.branchId,
  };
}
export type Ctx = NonNullable<Awaited<ReturnType<typeof getContext>>>;

export async function requireContext(perm?: Permission): Promise<Ctx> {
  const ctx = await getContext();
  if (!ctx) redirect("/login");
  if (perm && !can(ctx.role, perm)) throw new Error("FORBIDDEN");
  return ctx;
}
