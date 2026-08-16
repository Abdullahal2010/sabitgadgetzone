'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppUser } from '@/types';

export default function AdminUserRow({ user }: { user: AppUser }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Remove ${user.phone}?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/users/${user._id}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) router.refresh();
    else alert('Failed to remove user.');
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2.5 pr-3 text-sm font-medium text-navy">{user.name}</td>
      <td className="py-2.5 pr-3 text-sm text-muted">{user.phone}</td>
      <td className="py-2.5 pr-3 font-mono text-sm">৳{(user.walletBalance ?? 0).toLocaleString()}</td>
      <td className="py-2.5 text-right">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm font-semibold text-red-500 hover:underline disabled:opacity-50"
        >
          {deleting ? 'Removing…' : 'Remove'}
        </button>
      </td>
    </tr>
  );
}
