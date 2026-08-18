import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import AdminNav from '@/components/AdminNav';
import { getSessionUser } from '@/lib/serverAuth';
import { canAccessAdminArea, canManageUsers, canViewDashboardStats, canViewOrders } from '@/lib/permissions';

/**
 * Every /admin/* page shares this layout. middleware.ts is now the first
 * line of defense (see its doc comment — it checks a fresh DB read via
 * /api/auth/session-permissions before this even renders), but this layout
 * repeats the same check as defense in depth, since a Server Component is
 * cheap DB access and it's the last line before any admin content renders.
 *
 * Reuses the storefront Header (per the design ask) so admins/moderators
 * get the same top nav, cart/wishlist icons and notification bell — but
 * never the storefront Footer (SiteChrome already excludes it for
 * /admin/* paths). The sidebar (AdminNav) is given each permission flag
 * up front so it only ever renders links the signed-in user can actually
 * use — a moderator missing "view orders" simply never sees that link.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect('/login');
  }
  if (!canAccessAdminArea(sessionUser)) {
    redirect('/profile');
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Header />
      <div className="mx-auto flex w-full max-w-[1560px] flex-1 flex-col md:flex-row">
        <AdminNav
          role={sessionUser.role}
          canViewOrders={canViewOrders(sessionUser)}
          canViewDashboardStats={canViewDashboardStats(sessionUser)}
          canManageUsers={canManageUsers(sessionUser)}
        />
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
