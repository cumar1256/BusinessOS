import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { loginAction } from "@/server/auth-actions";

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Sign in</h1>
      <p className="mb-5 text-sm text-muted">Welcome back to your business.</p>
      <AuthForm action={loginAction} submit="Sign in" fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
      ]} />
      <p className="mt-5 text-sm text-muted">New here? <Link className="font-medium text-brand" href="/register">Create a business</Link></p>
    </>
  );
}
