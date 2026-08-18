'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { AppUser } from '@/types';

interface UserContextValue {
  user: AppUser | null;
  loading: boolean;
  isNewUser: boolean;
  logout: () => Promise<void>;
  walletBalance: number;
  addMoney: (amount: number) => void;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

// Wallet balance is UI-only, as scoped in the original brief: "Add money"
// just bumps local React state for this session. Nothing is written back to
// MongoDB, so refreshing the page resets it to the user's stored balance.
//
// Real identity/session state now comes entirely from NextAuth (Auth.js) —
// see lib/authOptions.ts. This context just adapts useSession() into the
// shape the rest of the app already expects, plus the demo wallet behavior.
export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  // Tracks the /api/users/me fetch specifically. `status` from useSession()
  // flips to 'authenticated' as soon as the NextAuth JWT is confirmed, which
  // is BEFORE we've had a chance to fetch the real Mongo profile below. If
  // pages gate on `loading` alone using only `status`, there's a window
  // where loading=false but profile is still null — which used to bounce
  // people straight back to /login right after signing in. This flag closes
  // that window: `loading` (exposed below) stays true until the profile
  // fetch has actually settled.
  const [profileLoading, setProfileLoading] = useState(true);

  const sessionUser = session?.user as (AppUser & { phone?: string; isNewUser?: boolean }) | undefined;
  const phone = sessionUser?.phone;
  const isNewUser = Boolean(sessionUser?.isNewUser);

  // Once we have a verified, onboarded session, fetch the real Mongo
  // profile (wallet balance, name, etc.) so the UI has real data to show.
  useEffect(() => {
    if (status === 'loading') return;

    if (!phone || isNewUser) {
      setProfile(null);
      setWalletBalance(0);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    fetch('/api/users/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AppUser | null) => {
        if (cancelled) return;
        if (data) {
          setProfile(data);
          setWalletBalance(data.walletBalance ?? 0);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [phone, isNewUser, status]);

  // Uses NextAuth's own redirect (rather than `redirect: false` + a manual
  // router.push) deliberately: that combination raced the client-side
  // navigation against the sign-out cookie actually clearing, which could
  // leave a stale session cookie in place for the next request. Middleware
  // would then see that leftover cookie as "still logged in" and bounce a
  // freshly-logged-out user attempting to log back in straight to
  // /profile — which itself would bounce back to /login because the
  // client-side session had already cleared, landing them in a stuck
  // redirect loop (the "Loading your account…" screen that never
  // resolves). A real signOut redirect is a hard navigation: the cookie is
  // gone and the whole app reloads fresh before anything else runs.
  async function logout() {
    await signOut({ callbackUrl: '/' });
  }

  function addMoney(amount: number) {
    setWalletBalance((prev) => prev + amount);
  }

  // Called after /onboarding successfully creates the Mongo user, so the
  // NextAuth JWT's isNewUser flag gets refreshed without a full re-login.
  async function refreshSession() {
    await update();
  }

  // Called after a successful PATCH /api/users/me, so the freshly-edited
  // profile (name, address, email, dob, gender) shows up everywhere in the
  // app immediately without a full reload.
  async function refreshProfile() {
    if (!phone || isNewUser) return;
    try {
      const res = await fetch('/api/users/me');
      if (!res.ok) return;
      const data: AppUser = await res.json();
      setProfile(data);
      setWalletBalance(data.walletBalance ?? 0);
    } catch {
      // best-effort — leave the previous profile state as-is
    }
  }

  return (
    <UserContext.Provider
      value={{
        user: profile,
        // Authenticated-but-still-fetching-the-Mongo-profile counts as
        // loading too — see the comment above profileLoading.
        loading: status === 'loading' || (status === 'authenticated' && !isNewUser && profileLoading),
        isNewUser,
        logout,
        walletBalance,
        addMoney,
        refreshSession,
        refreshProfile
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
