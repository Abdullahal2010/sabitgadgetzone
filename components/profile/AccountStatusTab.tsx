'use client';

import { AppUser } from '@/types';
import { formatDate, ShieldIcon } from './icons';

export default function AccountStatusTab({ user }: { user: AppUser }) {
  const isBanned = Boolean(user.banned);
  const isRestricted =
    !isBanned && user.restrictions && (user.restrictions.canShop === false || user.restrictions.canReview === false);

  const statusLabel = isBanned ? 'Banned' : isRestricted ? 'Restricted' : 'Active';
  const statusColors = isBanned
    ? { bg: '#FDECEC', fg: '#DC2626' }
    : isRestricted
    ? { bg: '#FEF3E2', fg: '#B45309' }
    : { bg: '#E4F9F1', fg: '#0F9D6B' };

  const description = isBanned
    ? "Your account has been banned by an admin. You can still browse products, but shopping and posting reviews are disabled."
    : isRestricted
    ? 'Some actions on your account have been restricted by an admin. See below for details.'
    : 'Your account is in good standing and has full access to shopping, orders, and wallet features.';

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl2 border border-border bg-white p-6 shadow-card">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: statusColors.bg, color: statusColors.fg }}
          >
            <ShieldIcon className="h-8 w-8" />
          </div>
          <span
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-bold"
            style={{ backgroundColor: statusColors.bg, color: statusColors.fg }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColors.fg }} />
            {statusLabel}
          </span>
          <p className="max-w-sm text-sm text-muted">{description}</p>

          {isBanned && user.banReason && (
            <p className="max-w-sm rounded-lg bg-red-50 px-4 py-2 text-xs font-medium text-red-600">
              Reason: {user.banReason}
            </p>
          )}

          {isRestricted && (
            <ul className="flex flex-col gap-1 text-xs font-medium text-amber-700">
              {user.restrictions?.canShop === false && <li>• Shopping / checkout is disabled</li>}
              {user.restrictions?.canReview === false && <li>• Posting reviews is disabled</li>}
            </ul>
          )}
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

      {(isBanned || isRestricted) && (
        <div className="rounded-xl2 border border-dashed border-border bg-bg p-5 text-sm text-muted">
          <p className="font-semibold text-navy">Appeal this decision</p>
          <p className="mt-1">
            Think this was a mistake? Direct messaging with an admin to appeal is coming soon. For now, reach out
            to support at the contact details in the footer.
          </p>
          <button
            disabled
            className="mt-3 cursor-not-allowed rounded-full bg-border px-4 py-2 text-xs font-bold text-muted"
          >
            Start an appeal — coming soon
          </button>
        </div>
      )}

      {!isBanned && !isRestricted && (
        <div className="rounded-xl2 border border-dashed border-border bg-bg p-5 text-sm text-muted">
          <p className="font-semibold text-navy">Coming soon</p>
          <p className="mt-1">
            If your account is ever restricted or banned, the reason and any next steps — including how to appeal
            — will show here.
          </p>
        </div>
      )}
    </div>
  );
}
