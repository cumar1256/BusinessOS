import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { registerAction } from "@/server/auth-actions";

const types = [["retail","Shop / retail"],["wholesale","Wholesale"],["pharmacy","Pharmacy"],["restaurant","Restaurant / café"],["hotel","Hotel"],["services","Services"],["other","Other"]];

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Create your business</h1>
      <p className="mb-5 text-sm text-muted">Takes a minute. You can add branches and staff later.</p>
      <AuthForm action={registerAction} submit="Create business" fields={[
        { name: "businessName", label: "Business name" },
        { name: "name", label: "Your full name", autoComplete: "name" },
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
      ]}>
        <label className="block text-sm font-medium">Business type
          <select name="businessType" className="mt-1.5 h-10 w-full rounded-[var(--radius)] border border-line bg-surface px-3 text-sm font-normal">
            {types.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </AuthForm>
      <p className="mt-5 text-sm text-muted">Already have an account? <Link className="font-medium text-brand" href="/login">Sign in</Link></p>
    </>
  );
}
