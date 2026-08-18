'use client';

import { useState } from 'react';
import { AppUser, ModeratorPermissions, Role, UserRestrictions } from '@/types';

const MODERATOR_PERMISSION_LABELS: { key: keyof ModeratorPermissions; label: string; hint: string }[] = [
  { key: 'addProducts', label: 'Add products', hint: 'Create new product listings' },
  { key: 'editProducts', label: 'Edit products', hint: 'Change price, stock, details of existing products' },
  { key: 'deleteProducts', label: 'Delete products', hint: 'Remove products entirely' },
  { key: 'viewOrders', label: 'View orders', hint: 'See the unresolved orders queue' },
  { key: 'changeOrderStatus', label: 'Change order status', hint: 'Mark orders as processing/shipped/etc' }
];

const DEFAULT_MOD_PERMISSIONS: ModeratorPermissions = {
  addProducts: true,
  editProducts: true,
  deleteProducts: true,
  viewOrders: true,
  changeOrderStatus: true
};

const DEFAULT_RESTRICTIONS: UserRestrictions = { canShop: true, canReview: true };

export default function ManageUserModal({
  user,
  onClose,
  onSaved
}: {
  user: AppUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<Role>(user.role);
  const [modPerms, setModPerms] = useState<ModeratorPermissions>(user.moderatorPermissions || DEFAULT_MOD_PERMISSIONS);
  const [banned, setBanned] = useState(Boolean(user.banned));
  const [banReason, setBanReason] = useState(user.banReason || '');
  const [restrictions, setRestrictions] = useState<UserRestrictions>(user.restrictions || DEFAULT_RESTRICTIONS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          moderatorPermissions: role === 'moderator' ? modPerms : undefined,
          banned,
          banReason: banned ? banReason : undefined,
          restrictions: role === 'user' ? restrictions : undefined
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save changes.');
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl2 bg-white p-6 shadow-card-lg"
      >
        <h3 className="text-lg font-extrabold text-navy">Manage {user.name}</h3>
        <p className="mt-0.5 text-xs text-muted">{user.phone} · {user.email}</p>

        {/* Role */}
        <div className="mt-5">
          <p className="mb-2 text-sm font-bold text-navy">Role</p>
          <div className="flex gap-2">
            {(['user', 'moderator'] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition ${
                  role === r ? 'border-brand bg-brand-light text-brand-dark' : 'border-border text-muted hover:bg-bg'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Moderator permissions — only shown when role is (or is being set to) moderator */}
        {role === 'moderator' && (
          <div className="mt-5 rounded-lg border border-border bg-bg p-4">
            <p className="mb-1 text-sm font-bold text-navy">Moderator access</p>
            <p className="mb-3 text-xs text-muted">
              Toggle exactly what this moderator can do. Everything else on the site stays off-limits to them.
            </p>
            <div className="flex flex-col gap-2.5">
              {MODERATOR_PERMISSION_LABELS.map(({ key, label, hint }) => (
                <label key={key} className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={modPerms[key]}
                    onChange={(e) => setModPerms((prev) => ({ ...prev, [key]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-border text-brand focus:ring-brand"
                  />
                  <span>
                    <span className="block text-sm font-medium text-navy">{label}</span>
                    <span className="block text-xs text-muted">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Restrictions — only meaningful for plain users */}
        {role === 'user' && (
          <div className="mt-5 rounded-lg border border-border bg-bg p-4">
            <p className="mb-1 text-sm font-bold text-navy">Restrictions</p>
            <p className="mb-3 text-xs text-muted">
              Block specific actions without a full ban — browsing always stays open.
            </p>
            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={restrictions.canShop}
                  onChange={(e) => setRestrictions((prev) => ({ ...prev, canShop: e.target.checked }))}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
                <span className="text-sm font-medium text-navy">Allowed to shop / checkout</span>
              </label>
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={restrictions.canReview}
                  onChange={(e) => setRestrictions((prev) => ({ ...prev, canReview: e.target.checked }))}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
                <span className="text-sm font-medium text-navy">Allowed to post reviews</span>
              </label>
            </div>
          </div>
        )}

        {/* Ban */}
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50/40 p-4">
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={banned}
              onChange={(e) => setBanned(e.target.checked)}
              className="h-4 w-4 rounded border-red-300 text-red-500 focus:ring-red-400"
            />
            <span className="text-sm font-bold text-red-600">Ban this account</span>
          </label>
          <p className="mt-1 text-xs text-muted">
            Blocks checkout and reviews everywhere. They can still browse, and can appeal from their profile.
          </p>
          {banned && (
            <input
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Reason (shown to the user)"
              className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
            />
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-full border border-border py-2.5 text-sm font-bold text-navy transition hover:bg-bg disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-full bg-brand py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
