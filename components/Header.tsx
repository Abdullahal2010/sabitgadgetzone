'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useUser } from '@/contexts/UserContext';

export default function Header() {
  const { count } = useCart();
  const { items: wishItems } = useWishlist();
  const { user } = useUser();
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(query ? `/?q=${encodeURIComponent(query)}` : '/');
  }

  return (
    <header className="sticky top-0 z-40 border-t-[3px] border-navy bg-brand">
      <div className="mx-auto flex max-w-[1560px] items-center gap-5 px-5 py-2.5">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2.5">
          <span className="block h-11 w-11 overflow-hidden rounded-[10px] bg-white shadow-card">
            <Image src="/logo.png" alt="Sabit Gadget's Zone logo" width={44} height={44} className="h-full w-full object-cover" />
          </span>
          <span className="whitespace-nowrap text-[19px] font-extrabold text-white">
            Sabit Gadget&apos;s Zone
          </span>
        </Link>

        <form onSubmit={handleSearch} className="flex h-9 max-w-[420px] flex-1 overflow-hidden rounded-md bg-white shadow-card">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search product"
            className="min-w-0 flex-1 border-none px-3.5 text-[13px] outline-none"
          />
          <button type="submit" className="flex w-[42px] flex-shrink-0 items-center justify-center text-brand" aria-label="Search">
            🔍
          </button>
        </form>

        <nav className="hidden gap-6 md:flex">
          <Link href="/" className="whitespace-nowrap text-[13.5px] font-medium text-white hover:text-brand-light">
            শপিং
          </Link>
          <Link href="/cart" className="whitespace-nowrap text-[13.5px] font-medium text-white hover:text-brand-light">
            অফার সমূহ
          </Link>
        </nav>

        <div className="ml-auto flex flex-shrink-0 items-center gap-3.5">
          <Link href="/cart" className="relative flex items-center gap-1.5 text-[13px] font-medium text-white hover:text-brand-light">
            🛒 <span className="hidden sm:inline">কার্ট দেখুন</span>
            <span className="absolute -right-2.5 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-teal px-1 text-[10px] font-bold text-white">
              {count}
            </span>
          </Link>
          <Link href="/wishlist" className="relative flex items-center gap-1.5 text-[13px] font-medium text-white hover:text-brand-light">
            ❤️
            <span className="absolute -right-2.5 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-teal px-1 text-[10px] font-bold text-white">
              {wishItems.length}
            </span>
          </Link>
          <span className="h-4 w-px bg-white/35" />
          <Link
            href={user ? '/profile' : '/login'}
            aria-label={user ? 'আমার একাউন্ট' : 'লগ ইন'}
            title={user ? 'আমার একাউন্ট' : 'লগ ইন'}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
              <path
                d="M4 20c0-3.7 3.6-6.5 8-6.5s8 2.8 8 6.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
