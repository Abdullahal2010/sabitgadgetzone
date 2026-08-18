'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useUser } from './UserContext';
import { AppNotification } from '@/types';

const POLL_INTERVAL_MS = 25_000;

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refreshList: () => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// Not truly real-time — the bell's red dot updates via polling every
// ~25s (see the product/engineering discussion: fine for account-status
// style notifications, no websocket infra needed for this). Only polls
// while a real (non-staff-irrelevant) signed-in user profile is loaded.
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, refreshProfile } = useUser();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function pollUnreadCount() {
    try {
      const res = await fetch('/api/notifications/unread-count');
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.count ?? 0);
    } catch {
      // best-effort — try again on the next poll tick
    }
    // Piggybacks on the same ~25s tick to also refresh the cached profile
    // (role, ban/restriction state, etc.) — this is what makes the
    // header's Dashboard link appear/disappear on its own after a
    // promotion or demotion, without needing a manual page reload.
    refreshProfile().catch(() => {});
  }

  async function refreshList() {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data: AppNotification[] = await res.json();
        setNotifications(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch('/api/notifications/mark-read', { method: 'PATCH' });
    } catch {
      // best-effort
    }
  }

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    pollUnreadCount();
    pollRef.current = setInterval(pollUnreadCount, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, refreshList, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
