'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import PasswordField from '@/components/PasswordField';
import BdPhoneField from '@/components/BdPhoneField';

const BD_LOCAL_REGEX = /^01[3-9]\d{8}$/; // 01XXXXXXXXX

// Login accepts EITHER the phone number or the email address, plus the
// password — no OTP here (see lib/authOptions.ts). A small tab lets the
// user pick which identifier they're using; the phone tab reuses the same
// BdPhoneField as registration (fixed +88 flag, 11-digit local part) so
// nobody has to type a country code by hand — it's applied automatically
// on submit.
export default function LoginPage() {
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    let identifier = '';
    if (method === 'phone') {
      if (!BD_LOCAL_REGEX.test(phoneInput.trim())) {
        setError('Enter a valid Bangladeshi mobile number, e.g. 01XXXXXXXXX');
        return;
      }
      identifier = `+88${phoneInput.trim()}`;
    } else {
      identifier = email.trim();
      if (!identifier) {
        setError('Enter your email address.');
        return;
      }
    }

    setLoading(true);
    try {
      const result = await signIn('identifier-password', { identifier, password, redirect: false });
      if (!result || result.error) {
        setError('Incorrect phone/email or password.');
        return;
      }
      // A hard navigation, not router.push('/profile') — same fix as
      // logout in contexts/UserContext.tsx, for the same reason: redirect:
      // false + a client-side router.push() races the App Router's
      // soft-navigation/middleware pass against the session cookie just
      // set by signIn(), which can land on /login (stuck until a hard
      // reload) even though the header already shows a logged-in state.
      // A full navigation guarantees the very next request — including
      // middleware's read of the cookie — sees the fresh session.
      window.location.href = '/profile';
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-xl2 border border-border bg-white p-8 shadow-card-lg">
      <h1 className="text-center text-2xl font-extrabold text-brand">Login</h1>
      <p className="mt-1 text-center text-sm text-muted">Welcome back! Enter your details below.</p>

      <div className="mt-5 flex gap-2 rounded-lg bg-bg p-1">
        <button
          type="button"
          onClick={() => setMethod('phone')}
          className={`flex-1 rounded-md py-1.5 text-xs font-bold transition ${
            method === 'phone' ? 'bg-white text-brand shadow-card' : 'text-muted'
          }`}
        >
          Phone
        </button>
        <button
          type="button"
          onClick={() => setMethod('email')}
          className={`flex-1 rounded-md py-1.5 text-xs font-bold transition ${
            method === 'email' ? 'bg-white text-brand shadow-card' : 'text-muted'
          }`}
        >
          Email
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        {method === 'phone' ? (
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            Phone Number
            <BdPhoneField value={phoneInput} onChange={setPhoneInput} autoFocus />
          </label>
        ) : (
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            Email
            <div className="flex items-center gap-2 rounded-lg bg-bg px-3 py-2.5 focus-within:ring-2 focus-within:ring-brand">
              <svg
                aria-hidden
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="flex-shrink-0 text-muted"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M4 20c0-3.7 3.6-6.5 8-6.5s8 2.8 8 6.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="email"
                required
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-muted"
              />
            </div>
          </label>
        )}

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
