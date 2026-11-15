"use client";

import { useActionState, useMemo, useState } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { createSaleAction, type POSActionState } from "@/server/pos-actions";

type Product = { id: string; name: string; sku: string; price: number; trackStock: boolean; stock: number };
type Customer = { id: string; name: string; phone: string | null };
type Method = { id: string; name: string };
type CartItem = { product: Product; quantity: number };
const initialState: POSActionState = {};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export function POSTerminal({ products, customers, paymentMethods, currency, branchName }: {
  products: Product[]; customers: Customer[]; paymentMethods: Method[]; currency: string; branchName: string;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? "");
  const [paid, setPaid] = useState("");
  const [state, formAction, pending] = useActionState(createSaleAction, initialState);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => !term || p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term));
  }, [products, search]);

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const paidValue = paid.trim() === "" ? total : Number(paid);
  const remaining = Math.max(0, total - (Number.isFinite(paidValue) ? paidValue : 0));
  const payload = JSON.stringify({
    items: cart.map(({ product, quantity }) => ({ productId: product.id, quantity })),
    customerId: customerId || undefined,
    paid: paid.trim() === "" ? total : Number(paid),
    paymentMethodId: paymentMethodId || undefined,
  });

  function add(product: Product) {
    if (product.trackStock && product.stock < 1) return;
    setCart((current) => {
      const found = current.find((item) => item.product.id === product.id);
      if (!found) return [...current, { product, quantity: 1 }];
      if (product.trackStock && found.quantity >= product.stock) return current;
      return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
    });
  }

  function change(id: string, amount: number) {
    setCart((current) => current.flatMap((item) => {
      if (item.product.id !== id) return [item];
      const quantity = item.quantity + amount;
      if (quantity < 1) return [];
      if (item.product.trackStock && quantity > item.product.stock) return [item];
      return [{ ...item, quantity }];
    }));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Point of sale</h1><p className="mt-1 text-sm text-muted">Branch: {branchName}</p></div>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">{products.length} products available</span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4">
          <div className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product name or SKU..." className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-4 text-sm" />
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">No products found. Add products in Inventory first.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id)?.quantity ?? 0;
                const unavailable = product.trackStock && product.stock <= 0;
                return (
                  <button key={product.id} type="button" disabled={unavailable} onClick={() => add(product)}
                    className="rounded-xl border border-line bg-surface p-4 text-left transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-50">
                    <span className="block truncate font-medium">{product.name}</span>
                    <span className="mt-1 block text-xs text-muted">{product.sku}</span>
                    <span className="mt-3 flex items-center justify-between gap-2">
                      <span className="font-semibold num">{money(product.price, currency)}</span>
                      <span className="text-xs text-muted">{product.trackStock ? `${product.stock} in stock` : "Stock not tracked"}{inCart ? ` · ${inCart} in cart` : ""}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-xl border border-line bg-surface p-4">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Current sale</h2><span className="text-xs text-muted">{cart.length} items</span></div>
          {cart.length === 0 ? (
            <div className="rounded-lg bg-surface-2 px-4 py-8 text-center text-sm text-muted"><ShoppingCart className="mx-auto mb-2" size={22} />Select products to start a sale.</div>
          ) : (
            <div className="max-h-72 space-y-3 overflow-y-auto">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between gap-3 border-b border-line pb-3">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="text-xs text-muted">{money(product.price, currency)} each</p></div>
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label="Decrease quantity" onClick={() => change(product.id, -1)} className="grid size-7 place-items-center rounded-md bg-surface-2"><Minus size={14} /></button>
                    <span className="w-6 text-center text-sm num">{quantity}</span>
                    <button type="button" aria-label="Increase quantity" onClick={() => change(product.id, 1)} className="grid size-7 place-items-center rounded-md bg-surface-2"><Plus size={14} /></button>
                    <button type="button" aria-label="Remove product" onClick={() => setCart((items) => items.filter((item) => item.product.id !== product.id))} className="ml-1 grid size-7 place-items-center rounded-md text-danger hover:bg-surface-2"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-3 border-t border-line pt-4">
            <label className="block text-xs font-medium text-muted">Customer (optional)
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink">
                <option value="">Walk-in customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.phone ? ` · ${customer.phone}` : ""}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium text-muted">Payment method
              <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink">
                {paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium text-muted">Amount received
              <input type="number" min="0" max={total} step="0.01" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder={money(total, currency)} className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink" />
            </label>
            <div className="flex justify-between text-sm"><span className="text-muted">Total</span><strong className="num">{money(total, currency)}</strong></div>
            <div className="flex justify-between text-sm"><span className="text-muted">Remaining / credit</span><strong className="num">{money(remaining, currency)}</strong></div>
            {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-950/30">{state.error}</p>}
            <form action={formAction}>
              <input type="hidden" name="payload" value={payload} />
              <button type="submit" disabled={pending || cart.length === 0 || !Number.isFinite(paidValue) || paidValue < 0 || paidValue > total || (paidValue > 0 && !paymentMethodId)}
                className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-brand-ink disabled:cursor-not-allowed disabled:opacity-50">
                {pending ? "Processing sale..." : "Complete sale"}
              </button>
            </form>
            <button type="button" onClick={() => { setCart([]); setPaid(""); }} disabled={cart.length === 0 || pending} className="w-full rounded-lg border border-line px-4 py-2 text-sm text-muted disabled:opacity-50">Clear cart</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
