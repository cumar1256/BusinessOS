import "server-only";
import type { Prisma } from "@prisma/client";

/** Default chart of accounts created for every new business. */
export const DEFAULT_ACCOUNTS = [
  { code: "1000", name: "Cash", type: "ASSET" },
  { code: "1010", name: "Mobile money (EVC/Zaad/Sahal)", type: "ASSET" },
  { code: "1020", name: "Bank", type: "ASSET" },
  { code: "1100", name: "Accounts receivable (customers)", type: "ASSET" },
  { code: "1200", name: "Inventory", type: "ASSET" },
  { code: "2000", name: "Accounts payable (suppliers)", type: "LIABILITY" },
  { code: "2100", name: "Salaries payable", type: "LIABILITY" },
  { code: "3000", name: "Owner's equity", type: "EQUITY" },
  { code: "4000", name: "Sales revenue", type: "REVENUE" },
  { code: "4100", name: "Sales returns", type: "REVENUE" },
  { code: "5000", name: "Cost of goods sold", type: "EXPENSE" },
  { code: "6000", name: "Operating expenses", type: "EXPENSE" },
  { code: "6100", name: "Salaries expense", type: "EXPENSE" },
] as const;

export type Line = { accountCode: string; debit?: number; credit?: number; partyType?: string; partyId?: string };

/** Posts a balanced journal entry. Must be called inside the same transaction as the business record. */
export async function postJournal(tx: Prisma.TransactionClient, p: {
  businessId: string; memo: string; refType?: string; refId?: string; lines: Line[];
}) {
  const debit = p.lines.reduce((s, l) => s + (l.debit ?? 0), 0);
  const credit = p.lines.reduce((s, l) => s + (l.credit ?? 0), 0);
  if (Math.abs(debit - credit) > 0.005) throw new Error(`Unbalanced journal: ${debit} vs ${credit}`);

  const accounts = await tx.account.findMany({
    where: { businessId: p.businessId, code: { in: p.lines.map((l) => l.accountCode) } },
  });
  const byCode = new Map(accounts.map((a) => [a.code, a.id]));
  return tx.journalEntry.create({
    data: {
      businessId: p.businessId, memo: p.memo, refType: p.refType, refId: p.refId,
      lines: {
        create: p.lines.map((l) => {
          const accountId = byCode.get(l.accountCode);
          if (!accountId) throw new Error(`Unknown account ${l.accountCode}`);
          return { accountId, debit: l.debit ?? 0, credit: l.credit ?? 0, partyType: l.partyType, partyId: l.partyId };
        }),
      },
    },
  });
}
