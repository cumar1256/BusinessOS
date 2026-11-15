"use server";
import { redirect } from "next/navigation";
import { hash, verify } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import { DEFAULT_ACCOUNTS } from "./ledger";
import { audit } from "./audit";

export type FormState = { error?: string; fieldErrors?: Record<string, string[] | undefined> };

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const d = parsed.data;

  if (await db.user.findUnique({ where: { email: d.email } }))
    return { fieldErrors: { email: ["This email is already registered"] } };

  const passwordHash = await hash(d.password);
  const slugBase = d.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "business";

  const { user, business } = await db.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email: d.email, name: d.name, passwordHash } });
    const business = await tx.business.create({
      data: {
        name: d.businessName, type: d.businessType,
        slug: `${slugBase}-${Math.random().toString(36).slice(2, 7)}`,
        memberships: { create: { userId: user.id, role: "OWNER" } },
        branches: { create: { name: "Main branch", isMain: true } },
        accounts: { create: DEFAULT_ACCOUNTS.map((a) => ({ ...a, system: true })) },
        exchangeRates: { create: { from: "USD", to: "SOS", rate: 570 } }, // owner should update in Settings
      },
    });
    const cash = await tx.account.findFirstOrThrow({ where: { businessId: business.id, code: "1000" } });
    const mobile = await tx.account.findFirstOrThrow({ where: { businessId: business.id, code: "1010" } });
    await tx.paymentMethod.createMany({
      data: [
        { businessId: business.id, name: "Cash", kind: "cash", accountId: cash.id },
        { businessId: business.id, name: "EVC Plus", kind: "mobile", accountId: mobile.id },
        { businessId: business.id, name: "Zaad", kind: "mobile", accountId: mobile.id },
        { businessId: business.id, name: "Sahal", kind: "mobile", accountId: mobile.id },
      ],
    });
    await audit({ businessId: business.id, userId: user.id }, "business.create", "Business", business.id, undefined, tx);
    return { user, business };
  });

  await createSession({ userId: user.id, businessId: business.id });
  redirect("/dashboard");
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const user = await db.user.findUnique({
    where: { email: parsed.data.email }, include: { memberships: { take: 1, orderBy: { id: "asc" } } },
  });
  // Same message for unknown email and wrong password (no account enumeration).
  const ok = user && user.active && (await verify(user.passwordHash, parsed.data.password));
  const m = user?.memberships[0];
  if (!ok || !m) return { error: "Email or password is incorrect" };

  await createSession({ userId: user.id, businessId: m.businessId });
  await audit({ businessId: m.businessId, userId: user.id }, "auth.login");
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
