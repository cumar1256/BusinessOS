import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { Ctx } from "./context";

type Client = Prisma.TransactionClient | typeof db;

export function audit(ctx: Pick<Ctx, "businessId" | "userId">, action: string,
  entity?: string, entityId?: string, meta?: Prisma.InputJsonValue, tx: Client = db) {
  return tx.auditLog.create({
    data: { businessId: ctx.businessId, userId: ctx.userId, action, entity, entityId, meta },
  });
}
