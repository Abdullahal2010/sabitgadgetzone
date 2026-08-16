'use client';

import { useWishlist } from '@/contexts/WishlistContext';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

export default function WishlistPage() {
  const { items } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-border bg-white p-10 text-center">
        <p className="text-muted">উইশলিস্ট খালি আছে</p>
        <Link href="/" className="mt-4 inline-block rounded-lg bg-brand px-5 py-2 font-semibold text-white">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-extrabold text-navy">Your wishlist ({items.length})</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
