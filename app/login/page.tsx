'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import PasswordField from '@/components/PasswordField';

// Plain identifier (phone OR email) + password login — no OTP here. OTP
// only happens once, during registration (see app/register/page.tsx), to
// prove EMAIL ownership before the password-protected account is created.
// See lib/authOptions.ts.
export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimmed = identifier.trim();
    if (!trimmed) {
      setError('Enter your phone number or email.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('identifier-password', { identifier: trimmed, password, redirect: false });
      if (!result || result.error) {
        setError('Incorrect phone/email or password.');
        return;
      }
      router.push('/profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-xl2 border border-border bg-white p-8 shadow-card-lg">
      <h1 className="text-center text-2xl font-extrabold text-brand">Login</h1>
      <p className="mt-1 text-center text-sm text-muted">Welcome back! Enter your details below.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
          Phone Number or Email
          <div className="flex items-center gap-2 rounded-lg bg-bg px-3 py-2.5 focus-within:ring-2 focus-within:ring-brand">
            <span aria-hidden className="flex-shrink-0 text-muted">
              👤
            </span>
            <input
              type="text"
              required
              autoFocus
              placeholder="01XXXXXXXXX or you@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-muted"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
          Password
          <PasswordField value={password} onChange={setPassword} autoComplete="current-password" />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand py-3 font-bold text-white shadow-card transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? 'Signing in…' : (
            <>
              Sign In <span aria-hidden>→</span>
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        নতুন এখানে?{' '}
        <Link href="/register" className="font-bold text-brand hover:text-brand-dark">
          অ্যাকাউন্ট তৈরি করুন
        </Link>
      </p>
    </div>
  );
}
