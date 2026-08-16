'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/users', label: 'Users' }
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') return null;

  async function handleLogout() {
    await fetch('/api/auth/admin-login', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <aside className="flex w-full flex-shrink-0 flex-col gap-1 border-r border-border bg-white p-4 md:w-56">
      <div className="mb-4 px-2 text-lg font-extrabold text-navy">Admin</div>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            pathname?.startsWith(link.href)
              ? 'bg-brand text-white'
              : 'text-navy hover:bg-brand-light'
          }`}
        >
          {link.label}
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="mt-4 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-50"
      >
        Log out
      </button>
      <Link href="/" className="mt-1 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-brand-light">
        ← Back to storefront
      </Link>
    </aside>
  );
}
