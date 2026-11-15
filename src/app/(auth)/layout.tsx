export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-7">
        <p className="mb-6 text-lg font-bold tracking-tight text-brand">BusinessOS</p>
        {children}
      </div>
    </main>
  );
}
