'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/UserContext';

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const { user } = useUser();
  const [email, setEmail] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  if (!user) {
    return (
      <div className="rounded-xl2 border border-dashed border-border bg-white p-10 text-center">
        <p className="text-muted">Log in first to check out.</p>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-brand px-5 py-2 font-semibold text-white">
          Log in
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-border bg-white p-10 text-center text-muted">
        Your cart is empty.
      </div>
    );
  }

  async function handleNext() {
    setPlacing(true);
    setError('');
    try {
      const res = await fetch('/api/checkout/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          cusEmail: email || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start checkout');
      // Note: the cart is intentionally NOT cleared here — it's only
      // cleared once payment is actually confirmed on the success page,
      // so an abandoned/failed payment doesn't lose the customer's cart.
      window.location.href = data.paymentUrl;
    } catch (err: any) {
      setError(err.message);
      setPlacing(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-xl2 border border-border bg-white p-6">
      <h1 className="mb-4 text-lg font-extrabold text-navy">Checkout</h1>
      <div className="mb-4 flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm">
            <span>
              {item.title} × {item.quantity}
            </span>
            <span className="font-mono">৳{(item.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="mb-5 flex justify-between border-t border-border pt-3 text-[15px] font-bold">
        <span>Total payable</span>
        <span className="text-brand-dark">৳{subtotal.toLocaleString()}</span>
      </div>

      <label className="mb-1 block text-xs font-semibold text-navy">Email (for your payment receipt)</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="mb-4 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
      />

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      <button
        onClick={handleNext}
        disabled={placing}
        className="w-full rounded-lg bg-brand py-3 font-bold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {placing ? 'Redirecting…' : 'Next'}
      </button>
      <p className="mt-3 text-center text-[11px] text-muted">
        You&apos;ll choose bKash, Nagad, Rocket, or another method on the next screen.
      </p>
    </div>
  );
}
