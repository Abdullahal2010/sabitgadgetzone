'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BdPhoneField from '@/components/BdPhoneField';

const BD_LOCAL_REGEX = /^01[3-9]\d{8}$/; // 01XXXXXXXXX

export default function AddUserForm() {
  const router = useRouter();
  const [phoneInput, setPhoneInput] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!BD_LOCAL_REGEX.test(phoneInput.trim())) {
      setError('Enter a valid Bangladeshi mobile number, e.g. 01XXXXXXXXX');
      return;
    }
    const phone = `+88${phoneInput.trim()}`;

    setSaving(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, email, name })
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Failed to add user.');
      return;
    }
    setPhoneInput('');
    setEmail('');
    setName('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-5 flex flex-wrap items-end gap-3 rounded-xl2 border border-border bg-white p-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-navy">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-navy">
        Phone number
        <BdPhoneField value={phoneInput} onChange={setPhoneInput} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-navy">
        Email
        <input
          required
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? 'Adding…' : '+ Add user'}
      </button>
    </form>
  );
}
