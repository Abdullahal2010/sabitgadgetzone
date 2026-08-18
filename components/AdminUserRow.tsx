'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppUser } from '@/types';
import ManageUserModal from '@/components/ManageUserModal';

export default function AdminUserRow({ user, currentUserId }: { user: AppUser; currentUserId: string }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isSelf = user._id === currentUserId;

  async function handleDelete() {
    if (!confirm(`Permanently delete "${user.name}"? This can't be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/users/${user._id}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) router.refresh();
    else alert('Failed to delete user.');
  }

  const statusLabel = user.banned
    ? 'Banned'
    : user.restrictions && (user.restrictions.canShop === false || user.restrictions.canReview === false)
    ? 'Restricted'
    : 'Active';

  const statusClass =
    statusLabel === 'Banned'
      ? 'bg-red-50 text-red-600'
      : statusLabel === 'Restricted'
      ? 'bg-amber-50 text-amber-600'
      : 'bg-[#E4F9F1] text-[#0F9D6B]';

  const roleClass =
    user.role === 'admin'
      ? 'bg-navy text-white'
      : user.role === 'moderator'
      ? 'bg-brand-light text-brand-dark'
      : 'bg-bg text-muted';

  return (
    <>
      <tr className="border-b border-border last:border-0">
        <td className="py-2.5 pr-3 text-sm font-medium text-navy">{user.name}</td>
        <td className="py-2.5 pr-3 text-sm text-muted">{user.phone}</td>
        <td className="py-2.5 pr-3">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${roleClass}`}>
            {user.role}
          </span>
        </td>
        <td className="py-2.5 pr-3">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusClass}`}>{statusLabel}</span>
        </td>
        <td className="py-2.5 pr-3 font-mono text-sm">৳{(user.walletBalance ?? 0).toLocaleString()}</td>
        <td className="py-2.5 text-right">
          {isSelf || user.role === 'admin' ? (
            <span className="text-xs text-muted">—</span>
          ) : (
            <>
              <button
                onClick={() => setShowModal(true)}
                className="mr-3 text-sm font-semibold text-brand hover:underline"
              >
                Manage
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm font-semibold text-red-500 hover:underline disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          )}
        </td>
      </tr>

      {showModal && (
        <ManageUserModal
          user={user}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
