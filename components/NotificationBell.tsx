'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/contexts/NotificationContext';
import { useUser } from '@/contexts/UserContext';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, loading, refreshList, markAllRead } = useNotifications();
  const { refreshProfile } = useUser();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      await refreshList();
      await markAllRead();
      // A role/permission change is exactly the kind of thing a
      // notification announces — refresh the cached profile (which drives
      // the header's Dashboard link, etc.) right when the user is looking
      // at what changed, rather than waiting for their next reload.
      await refreshProfile();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 3.5c-3 0-5.4 2.4-5.4 5.4v3.3c0 .6-.2 1.2-.6 1.7L4.5 15.6c-.6.8 0 2 1 2h13c1 0 1.6-1.2 1-2l-1.5-1.7c-.4-.5-.6-1.1-.6-1.7V8.9c0-3-2.4-5.4-5.4-5.4Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M9.7 19.5a2.3 2.3 0 0 0 4.6 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-brand" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 max-w-[90vw] overflow-hidden rounded-xl2 border border-border bg-white text-navy shadow-card-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-extrabold">Notifications</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && <p className="px-4 py-6 text-center text-sm text-muted">Loading…</p>}
            {!loading && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted">No notifications yet.</p>
            )}
            {!loading &&
              notifications.map((n) => {
                const content = (
                  <div className={`px-4 py-3 text-sm ${!n.read ? 'bg-brand-light/40' : ''}`}>
                    <p className="font-bold text-navy">{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted/70">{timeAgo(n.createdAt)}</p>
                  </div>
                );
                return n.link ? (
                  <Link key={n._id} href={n.link} className="block border-b border-border last:border-0 hover:bg-bg">
                    {content}
                  </Link>
                ) : (
                  <div key={n._id} className="border-b border-border last:border-0">
                    {content}
                  </div>
                );
              })}
          </div>
          <div className="border-t border-border bg-bg px-4 py-2.5 text-center text-[11px] text-muted">
            Important updates are also sent to your email.
          </div>
        </div>
      )}
    </div>
  );
}
