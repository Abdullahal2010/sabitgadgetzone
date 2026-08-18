'use client';

import { useEffect, useState } from 'react';
import { AppUser } from '@/types';
import { TrashIcon } from './icons';

type SocialLink = { id: string; platform: string; url: string };

const SOCIAL_PLATFORMS = ['Facebook', 'Instagram', 'X (Twitter)', 'YouTube', 'Website'];

export default function SettingsTab({
  user,
  onProfileUpdated
}: {
  user: AppUser;
  onProfileUpdated: () => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [address, setAddress] = useState(user.address || '');
  const [dob, setDob] = useState(user.dob ? user.dob.slice(0, 10) : '');
  const [gender, setGender] = useState<'male' | 'female' | ''>(user.gender || '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Keep the form in sync if the underlying profile changes elsewhere
  // (e.g. right after this same form saves and the context refetches it).
  useEffect(() => {
    setName(user.name);
    setAddress(user.address || '');
    setDob(user.dob ? user.dob.slice(0, 10) : '');
    setGender(user.gender || '');
  }, [user]);

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newPlatform, setNewPlatform] = useState(SOCIAL_PLATFORMS[0]);
  const [newUrl, setNewUrl] = useState('');

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaveError('');
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address, dob, gender })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error || 'Could not save changes — please try again.');
        return;
      }
      await onProfileUpdated();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError('Could not save changes — please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleAddSocial() {
    if (!newUrl.trim()) return;
    setSocialLinks((prev) => [...prev, { id: crypto.randomUUID(), platform: newPlatform, url: newUrl.trim() }]);
    setNewUrl('');
  }

  function handleRemoveSocial(id: string) {
    setSocialLinks((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Edit profile */}
      <form onSubmit={handleSaveProfile} className="rounded-xl2 border border-border bg-white p-6 shadow-card">
        <h2 className="mb-1 text-lg font-extrabold text-navy">Edit Profile</h2>
        <p className="mb-5 text-xs text-muted">
          Update your details below — registration doesn&apos;t collect an address, so add it here if you&apos;d
          like it saved for delivery.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            Full Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg bg-bg px-3 py-2.5 text-sm text-navy outline-none focus:ring-2 focus:ring-brand"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            Phone Number
            <input
              value={user.phone}
              disabled
              className="cursor-not-allowed rounded-lg bg-border/60 px-3 py-2.5 text-sm text-muted outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            Email
            <input
              value={user.email}
              disabled
              className="cursor-not-allowed rounded-lg bg-border/60 px-3 py-2.5 text-sm text-muted outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            Date of Birth
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="rounded-lg bg-bg px-3 py-2.5 text-sm text-navy outline-none focus:ring-2 focus:ring-brand"
            />
          </label>

          <div className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            Gender
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`flex-1 rounded-lg border px-2 py-2.5 text-sm font-medium transition ${
                  gender === 'male' ? 'border-brand bg-brand-light text-brand-dark' : 'border-transparent bg-bg text-muted'
                }`}
              >
                ♂ Male
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`flex-1 rounded-lg border px-2 py-2.5 text-sm font-medium transition ${
                  gender === 'female' ? 'border-brand bg-brand-light text-brand-dark' : 'border-transparent bg-bg text-muted'
                }`}
              >
                ♀ Female
              </button>
            </div>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy sm:col-span-2">
            Address
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, area, city"
              className="rounded-lg bg-bg px-3 py-2.5 text-sm text-navy outline-none placeholder:text-muted focus:ring-2 focus:ring-brand"
            />
          </label>
        </div>

        {saveError && <p className="mt-4 text-sm text-red-500">{saveError}</p>}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && <span className="text-sm font-semibold text-[#0F9D6B]">✓ Changes saved</span>}
        </div>
      </form>

      {/* Social accounts */}
      <div className="rounded-xl2 border border-border bg-white p-6 shadow-card">
        <h2 className="mb-1 text-lg font-extrabold text-navy">Social Accounts</h2>
        <p className="mb-5 text-xs text-muted">
          Link your social profiles so we can display them on your account. This section is a UI preview for
          now — links aren&apos;t saved to your account yet.
        </p>

        {socialLinks.length > 0 && (
          <ul className="mb-4 flex flex-col gap-2">
            {socialLinks.map((link) => (
              <li
                key={link.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-bg px-3.5 py-2.5 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex-shrink-0 rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand-dark">
                    {link.platform}
                  </span>
                  <span className="truncate text-navy">{link.url}</span>
                </div>
                <button
                  onClick={() => handleRemoveSocial(link.id)}
                  aria-label="Remove"
                  className="flex-shrink-0 text-muted transition hover:text-red-500"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value)}
            className="rounded-lg bg-bg px-3 py-2.5 text-sm text-navy outline-none focus:ring-2 focus:ring-brand sm:w-44"
          >
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://…"
            className="flex-1 rounded-lg bg-bg px-3 py-2.5 text-sm text-navy outline-none placeholder:text-muted focus:ring-2 focus:ring-brand"
          />
          <button
            onClick={handleAddSocial}
            className="rounded-lg bg-brand-light px-4 py-2.5 text-sm font-bold text-brand-dark transition hover:bg-brand hover:text-white"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Account deletion is admin-only now — see Account Status tab for
          how to reach support if you want your account removed. */}
    </div>
  );
}
