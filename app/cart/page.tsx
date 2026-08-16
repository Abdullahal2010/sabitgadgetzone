'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';

export default function CartPage() {
  const { items, removeItem, changeQuantity, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-border bg-white p-10 text-center">
        <p className="text-muted">আপনার কার্ট খালি</p>
        <Link href="/" className="mt-4 inline-block rounded-lg bg-brand px-5 py-2 font-semibold text-white">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4 rounded-xl2 border border-border bg-white p-4">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-brand-light">
              <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-navy">{item.title}</div>
              <div className="font-mono text-sm font-bold text-brand-dark">৳{item.price.toLocaleString()}</div>
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  onClick={() => changeQuantity(item.productId, -1)}
                  className="h-6 w-6 rounded-md bg-brand-light font-bold text-brand-dark"
                >
                  −
                </button>
                <span className="font-mono">{item.quantity}</span>
                <button
                  onClick={() => changeQuantity(item.productId, 1)}
                  className="h-6 w-6 rounded-md bg-brand-light font-bold text-brand-dark"
                >
                  +
                </button>
              </div>
            </div>
            <button onClick={() => removeItem(item.productId)} className="self-start text-xs font-semibold text-red-500">
              মুছুন
            </button>
          </div>
        ))}
      </div>

      <div className="h-fit rounded-xl2 border border-border bg-white p-5">
        <div className="mb-3 flex justify-between text-[14.5px] font-bold">
          <span>Subtotal</span>
          <span className="text-brand-dark">৳{subtotal.toLocaleString()}</span>
        </div>
        <Link
          href="/checkout"
          className="block rounded-lg bg-brand py-3 text-center font-bold text-white hover:bg-brand-dark"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
