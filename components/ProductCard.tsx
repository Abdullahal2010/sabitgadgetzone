'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import StarIcon from './StarIcon';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isWished, toggle } = useWishlist();
  const wished = isWished(product._id);
  const ratingAverage = product.ratingAverage ?? 0;
  const ratingCount = product.ratingCount ?? 0;
  const sold = product.sold ?? 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl2 border border-border bg-white transition hover:-translate-y-1 hover:shadow-card-lg">
      <div className="relative aspect-[1/0.95] bg-brand-light">
        <Link href={`/products/${product._id}`}>
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-cover"
          />
        </Link>
        <button
          onClick={() => toggle(product)}
          aria-label="Toggle wishlist"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-card"
        >
          <span className={wished ? 'text-red-500' : 'text-brand'}>{wished ? '♥' : '♡'}</span>
        </button>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <Link href={`/products/${product._id}`} className="mb-1.5 truncate text-[13.2px] font-semibold text-navy">
          {product.title}
        </Link>
        <div className="mb-1 flex items-baseline justify-between gap-1.5">
          <span className="font-mono text-[14.5px] font-extrabold text-brand-dark">৳{product.price.toLocaleString()}</span>
          {product.stock <= 0 && <span className="text-[11px] font-semibold text-red-500">Out of stock</span>}
        </div>
        <div className="flex items-center gap-1 text-[10.8px] text-muted">
          <StarIcon className="h-[11px] w-[11px] text-star" />
          <span>
            {ratingAverage.toFixed(1)}/5 ({ratingCount}) &bull; {sold} Sold
          </span>
        </div>
        <div className="mt-auto text-[10.8px] text-muted">{product.stock} in stock</div>
        <button
          onClick={() =>
            addItem({
              productId: product._id,
              title: product.title,
              price: product.price,
              imageUrl: product.imageUrl
            })
          }
          disabled={product.stock <= 0}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-brand-light py-1.5 text-[11.8px] font-bold text-brand-dark transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          🛒 কার্টে যোগ করুন
        </button>
      </div>
    </div>
  );
}
