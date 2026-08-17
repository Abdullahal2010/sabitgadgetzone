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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
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
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="20.5" r="1.4" fill="currentColor" />
              <circle cx="17.5" cy="20.5" r="1.4" fill="currentColor" />
            </svg>
            <span className="hidden sm:inline">কার্ট দেখুন</span>
            <span className="absolute -right-2.5 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-teal px-1 text-[10px] font-bold text-white">
              {count}
            </span>
          </Link>
          <Link href="/wishlist" className="relative flex items-center gap-1.5 text-[13px] font-medium text-white hover:text-brand-light">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 20.2s-7.5-4.6-9.7-9.4C.7 7.1 2.6 3.8 6 3.3c2-.3 3.9.6 5 2.2 1.1-1.6 3-2.5 5-2.2 3.4.5 5.3 3.8 3.7 7.5-2.2 4.8-9.7 9.4-9.7 9.4Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute -right-2.5 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-teal px-1 text-[10px] font-bold text-white">
              {wishItems.length}
            </span>
          </Link>
          <span className="h-4 w-px bg-white/35" />
          {user ? (
            <Link
              href="/profile"
              aria-label="আমার একাউন্ট"
              title="আমার একাউন্ট"
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
          ) : (
            <Link
              href="/login"
              className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-brand shadow-card transition hover:bg-white/90"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M14 6.5V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1.5M9 12h11m0 0-3.5-3.5M20 12l-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              লগ ইন
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
