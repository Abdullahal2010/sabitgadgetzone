'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

type Status = 'checking' | 'completed' | 'pending' | 'failed' | 'error';

export default function CheckoutSuccessPage() {
  const params = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const orderId = params.get('orderId');
    const transactionId = params.get('transactionId');

    if (!orderId || !transactionId) {
      setStatus('error');
      return;
    }

    // This call is what actually confirms payment — nothing about
    // landing on this page is trusted by itself. See /api/checkout/verify.
    fetch('/api/checkout/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, transactionId })
    })
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.paymentStatus || 'error');
        if (data.paymentStatus === 'completed') clearCart();
      })
      .catch(() => setStatus('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'checking') {
    return (
      <div className="rounded-xl2 border border-border bg-white p-10 text-center">
        <p className="text-muted">Confirming your payment…</p>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="rounded-xl2 border border-border bg-white p-10 text-center">
        <p className="text-2xl">🎉</p>
        <h1 className="mt-2 text-lg font-extrabold text-navy">Payment successful!</h1>
        <p className="mt-1 text-muted">Your order is confirmed and now being processed.</p>
        <Link href="/profile" className="mt-5 inline-block rounded-lg bg-brand px-5 py-2 font-semibold text-white">
          View my orders
        </Link>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="rounded-xl2 border border-border bg-white p-10 text-center">
        <h1 className="text-lg font-extrabold text-navy">Payment pending</h1>
        <p className="mt-1 text-muted">
          Your bank/wallet is still processing this payment. Check your order status in a few
          minutes — you don't need to pay again.
        </p>
        <Link href="/profile" className="mt-5 inline-block rounded-lg bg-brand px-5 py-2 font-semibold text-white">
          View my orders
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl2 border border-border bg-white p-10 text-center">
      <h1 className="text-lg font-extrabold text-navy">We couldn't confirm this payment</h1>
      <p className="mt-1 text-muted">Nothing was charged to your order. You can try again from your cart.</p>
      <Link href="/cart" className="mt-5 inline-block rounded-lg bg-brand px-5 py-2 font-semibold text-white">
        Back to cart
      </Link>
    </div>
  );
}
