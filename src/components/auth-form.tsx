"use client";
import { useActionState } from "react";
import type { FormState } from "@/server/auth-actions";

export type Field = { name: string; label: string; type?: string; autoComplete?: string };
const input = "h-10 w-full rounded-[var(--radius)] border border-line bg-surface px-3 text-sm outline-none focus:border-brand";

export function AuthForm({ action, fields, submit, children }: {
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  fields: Field[]; submit: string; children?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      {state.error && <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>}
      {fields.map((f) => (
        <label key={f.name} className="block text-sm font-medium">
          {f.label}
          <input name={f.name} type={f.type ?? "text"} autoComplete={f.autoComplete} required className={`${input} mt-1.5 font-normal`} />
          {state.fieldErrors?.[f.name]?.[0] && <span className="mt-1 block text-xs text-danger">{state.fieldErrors[f.name]![0]}</span>}
        </label>
      ))}
      {children}
      <button disabled={pending} className="h-10 w-full rounded-[var(--radius)] bg-brand text-sm font-semibold text-brand-ink transition-opacity disabled:opacity-60">
        {pending ? "Please wait…" : submit}
      </button>
    </form>
  );
}
