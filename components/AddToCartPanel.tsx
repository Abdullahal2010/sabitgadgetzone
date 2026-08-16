'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

export default function AddToCartPanel({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isWished, toggle } = useWishlist();
  const [added, setAdded] = useState(false);
  const router = useRouter();

  function handleAdd() {
    addItem({
      productId: product._id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button
        onClick={handleAdd}
        disabled={product.stock <= 0}
        className="rounded-lg bg-brand px-6 py-2.5 font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {added ? 'Added ✓' : 'Add to cart'}
      </button>
      <button
        onClick={() => {
          handleAdd();
          router.push('/checkout');
        }}
        disabled={product.stock <= 0}
        className="rounded-lg border border-brand px-6 py-2.5 font-bold text-brand transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-50"
      >
        Buy now
      </button>
      <button
        onClick={() => toggle(product)}
        className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-navy hover:bg-brand-light"
      >
        {isWished(product._id) ? '♥ In wishlist' : '♡ Add to wishlist'}
      </button>
    </div>
  );
}
