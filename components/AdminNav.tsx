'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Role } from '@/types';

function DashboardIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.7" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.7" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="10.5" width="7.5" height="10" rx="1.7" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.7" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function ProductsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.8 7.5 12 3.5l8.2 4v9L12 20.5l-8.2-4v-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M3.8 7.5 12 11.5l8.2-4M12 11.5v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function OrdersIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 3.5h12l1 5.5v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9L6 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M4 9h16M9 13h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.3 19.5c.6-3.3 3-5.2 5.7-5.2s5.1 1.9 5.7 5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.5 5.3a3.2 3.2 0 0 1 0 6.3M17.2 14.5c2.4.4 4.1 2.1 4.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 4.5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3M15.5 16l4-4-4-4M19 12H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface AdminNavProps {
  role: Role;
  canViewOrders: boolean;
  canViewDashboardStats: boolean;
  canManageUsers: boolean;
}

// Sidebar shown on every /admin/* page. Which links appear is decided by
// the server layout (app/admin/layout.tsx), which passes down freshly
// DB-read permission flags as props — so a moderator who's had "view
// orders" turned off never even sees that link, rather than seeing it and
// hitting a 403 after clicking.
export default function AdminNav({ role, canViewOrders, canViewDashboardStats, canManageUsers }: AdminNavProps) {
  const pathname = usePathname();

  const links = [
    canViewDashboardStats && { href: '/admin/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { href: '/admin/products', label: 'Products', icon: <ProductsIcon /> },
    canViewOrders && { href: '/admin/orders', label: 'Orders', icon: <OrdersIcon /> },
    canManageUsers && { href: '/admin/users', label: 'Users', icon: <UsersIcon /> }
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];

  // Same reasoning as UserContext.logout() — a real signOut redirect
  // (not `redirect: false` + manual router.push) avoids the stale-cookie
  // redirect-loop bug on the next login attempt. See that comment for
  // detail.
  async function handleLogout() {
    await signOut({ callbackUrl: '/login' });
  }

  return (
    <aside className="flex w-full flex-shrink-0 flex-col gap-1 border-r border-border bg-white p-4 md:w-56">
      <div className="mb-4 px-2 text-lg font-extrabold capitalize text-navy">{role} panel</div>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
            pathname?.startsWith(link.href) ? 'bg-brand text-white' : 'text-navy hover:bg-brand-light'
          }`}
        >
          {link.icon}
          {link.label}
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="mt-4 flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-50"
      >
        <LogoutIcon />
        Log out
      </button>
      <Link href="/" className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-brand-light">
        <BackIcon />
        Back to storefront
      </Link>
    </aside>
  );
}
