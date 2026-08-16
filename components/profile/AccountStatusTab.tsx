'use client';

import { AppUser } from '@/types';
import { formatDate, ShieldIcon } from './icons';

export default function AccountStatusTab({ user }: { user: AppUser }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl2 border border-border bg-white p-6 shadow-card">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E4F9F1] text-[#0F9D6B]">
            <ShieldIcon className="h-8 w-8" />
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[#E4F9F1] px-3.5 py-1 text-sm font-bold text-[#0F9D6B]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#0F9D6B]" />
            Active
          </span>
          <p className="max-w-sm text-sm text-muted">
            Your account is in good standing and has full access to shopping, orders, and wallet features.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-bg px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Account ID</p>
            <p className="mt-0.5 truncate font-mono text-sm font-bold text-navy" title={user._id}>
              {user._id}
            </p>
          </div>
          <div className="rounded-lg bg-bg px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Verified Phone</p>
            <p className="mt-0.5 text-sm font-bold text-navy">{user.phone}</p>
          </div>
          <div className="rounded-lg bg-bg px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Member Since</p>
            <p className="mt-0.5 text-sm font-bold text-navy">{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl2 border border-dashed border-border bg-bg p-5 text-sm text-muted">
        <p className="font-semibold text-navy">Coming soon</p>
        <p className="mt-1">
          Admins will soon be able to restrict or suspend accounts for policy violations. If that ever happens to
          yours, the reason and any next steps will show here.
        </p>
      </div>
    </div>
  );
}
