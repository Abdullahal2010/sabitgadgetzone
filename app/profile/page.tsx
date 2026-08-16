'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Order, Review } from '@/types';
import ProfileTabs, { ProfileTabId } from '@/components/profile/ProfileTabs';
import OverviewTab from '@/components/profile/OverviewTab';
import OrdersTab from '@/components/profile/OrdersTab';
import SettingsTab from '@/components/profile/SettingsTab';
import AccountStatusTab from '@/components/profile/AccountStatusTab';
import HeroCard from '@/components/profile/HeroCard';

export default function ProfilePage() {
  const { user, loading, walletBalance, addMoney, logout, refreshProfile } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [myReviews, setMyReviews] = useState<Record<string, Review>>({});
  const [activeTab, setActiveTab] = useState<ProfileTabId>('overview');

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/orders?phone=${encodeURIComponent(user.phone)}`)
      .then((res) => res.json())
      .then(setOrders)
      .finally(() => setOrdersLoading(false));

    fetch('/api/reviews?mine=1')
      .then((res) => (res.ok ? res.json() : []))
      .then((reviews: Review[]) => {
        const byKey: Record<string, Review> = {};
        reviews.forEach((r) => {
          byKey[`${r.orderId}_${r.productId}`] = r;
        });
        setMyReviews(byKey);
      });
  }, [user]);

  function handleReviewSaved(orderId: string, productId: string, review: Review) {
    setMyReviews((prev) => ({ ...prev, [`${orderId}_${productId}`]: review }));
  }

  async function handleConfirmLogout() {
    setLoggingOut(true);
    await logout();
    router.push('/');
  }

  async function handleAccountDeleted() {
    await logout();
    router.push('/');
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-brand" />
          Loading your account…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-10">
      <HeroCard
        user={user}
        walletBalance={walletBalance}
        addMoney={addMoney}
        onLogoutClick={() => setShowLogoutConfirm(true)}
      />

      {/* Tab navigation */}
      <ProfileTabs active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab orders={orders} walletBalance={walletBalance} />}
      {activeTab === 'orders' && (
        <OrdersTab
          orders={orders}
          ordersLoading={ordersLoading}
          myReviews={myReviews}
          onReviewSaved={handleReviewSaved}
        />
      )}
      {activeTab === 'settings' && (
        <SettingsTab user={user} onProfileUpdated={refreshProfile} onAccountDeleted={handleAccountDeleted} />
      )}
      {activeTab === 'status' && <AccountStatusTab user={user} />}

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4 backdrop-blur-sm"
          onClick={() => !loggingOut && setShowLogoutConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl2 bg-white p-6 text-center shadow-card-lg"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 6.5V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-1.5M14 12H3m0 0 3.5-3.5M3 12l3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-extrabold text-navy">Log out?</h3>
            <p className="mt-1.5 text-sm text-muted">Are you sure you want to log out of your account?</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="flex-1 rounded-full border border-border py-2.5 text-sm font-bold text-navy transition hover:bg-bg disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                disabled={loggingOut}
                className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-red-600 disabled:opacity-60"
              >
                {loggingOut ? 'Logging out…' : 'Yes, log out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
