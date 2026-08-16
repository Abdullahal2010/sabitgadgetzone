'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import BdPhoneField from '@/components/BdPhoneField';
import PasswordField from '@/components/PasswordField';
import OtpInput from '@/components/OtpInput';

// Registration collects everything up front (name, phone, email, password,
// DOB, gender), THEN verifies the EMAIL via a one-time 6-digit code sent
// through Resend — the only time OTP is used anywhere in the app. Once the
// code is confirmed, the account is created and the user is signed straight
// in (no separate login step) — see app/api/auth/email-otp/request/route.ts,
// app/api/auth/register/route.ts and lib/authOptions.ts.
const BD_LOCAL_REGEX = /^01[3-9]\d{8}$/; // 01XXXXXXXXX
const BD_E164_REGEX = /^\+8801[3-9]\d{8}$/; // +8801XXXXXXXXX
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (BD_E164_REGEX.test(trimmed)) return trimmed;
  if (BD_LOCAL_REGEX.test(trimmed)) return `+88${trimmed}`;
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp'>('form');

  const [name, setName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');

  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  // Bumped whenever the OTP boxes need to clear back to the start (wrong
  // code, or a freshly (re)sent code) — OtpInput watches this prop.
  const [otpResetSignal, setOtpResetSignal] = useState(0);

  async function requestOtp(targetEmail: string) {
    const res = await fetch('/api/auth/email-otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err: any = new Error(data.error || 'Could not send the code — please try again.');
      err.retryAfterSeconds = data.retryAfterSeconds;
      throw err;
    }
  }

  async function handleSubmitDetails(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const normalizedPhone = normalizePhone(phoneInput);
    const normalizedEmail = email.trim().toLowerCase();

    if (!name.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (!normalizedPhone) {
      setError('Enter a valid Bangladeshi mobile number, e.g. 01XXXXXXXXX');
      return;
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!gender) {
      setError('Please select a gender.');
      return;
    }

    setSending(true);
    try {
      await requestOtp(normalizedEmail);
      setPhone(normalizedPhone);
      setEmail(normalizedEmail);
      setStep('otp');
      setOtpResetSignal((n) => n + 1);
    } catch (err: any) {
      setError(err?.message || 'Could not send the code — please try again.');
    } finally {
      setSending(false);
    }
  }

  async function handleOtpComplete(code: string) {
    setError('');
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password, dob, gender, code })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'That code was incorrect — please try again.');
        setOtpResetSignal((n) => n + 1); // clear boxes, restart from the beginning
        return;
      }

      // Same password the user just typed — signs them straight in with no
      // repeat login step.
      const result = await signIn('identifier-password', {
        identifier: email,
        password,
        redirect: false
      });
      if (!result || result.error) {
        router.push('/login');
        return;
      }
      router.push('/profile');
    } catch {
      setError('Something went wrong — please try again.');
      setOtpResetSignal((n) => n + 1);
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setError('');
    setSending(true);
    try {
      await requestOtp(email);
      setOtpResetSignal((n) => n + 1);
    } catch (err: any) {
      setError(err?.message || 'Could not resend the code — please try again.');
      if (err?.retryAfterSeconds) setCooldown(err.retryAfterSeconds);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-xl2 border border-border bg-white p-8 shadow-card-lg">
      <h1 className="text-center text-2xl font-extrabold text-brand">Create Account</h1>
      <p className="mt-1 text-center text-sm text-muted">
        {step === 'form' ? 'Join us today! Enter your details below.' : `Enter the 6-digit code sent to ${email}.`}
      </p>

      {step === 'form' ? (
        <form onSubmit={handleSubmitDetails} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            Full Name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nahid Ahmed"
              className="rounded-lg bg-bg px-3 py-2.5 text-sm text-navy outline-none placeholder:text-muted focus:ring-2 focus:ring-brand"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            Phone Number
            <BdPhoneField value={phoneInput} onChange={setPhoneInput} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-lg bg-bg px-3 py-2.5 text-sm text-navy outline-none placeholder:text-muted focus:ring-2 focus:ring-brand"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
              Password
              <PasswordField value={password} onChange={setPassword} autoComplete="new-password" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
              Confirm
              <PasswordField value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
              Date of Birth
              <input
                type="date"
                required
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
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {cooldown > 0 && (
            <p className="text-xs text-muted">You can request another code in about {cooldown}s.</p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand py-3 font-bold text-white shadow-card transition hover:bg-brand-dark disabled:opacity-60"
          >
            {sending ? 'Sending code…' : (
              <>
                Create Account <span aria-hidden>→</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <OtpInput onComplete={handleOtpComplete} resetSignal={otpResetSignal} disabled={verifying} />

          {verifying && <p className="text-center text-sm text-muted">Verifying…</p>}
          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={handleResend}
              disabled={sending || verifying}
              className="text-brand hover:text-brand-dark disabled:opacity-60"
            >
              {sending ? 'Sending…' : 'Resend code'}
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={() => {
                setStep('form');
                setError('');
              }}
              className="text-muted hover:text-brand"
            >
              Use different details
            </button>
          </div>
        </div>
      )}

      {step === 'form' && (
        <p className="mt-5 text-center text-sm text-muted">
          ইতিমধ্যে একাউন্ট আছে?{' '}
          <Link href="/login" className="font-bold text-brand hover:text-brand-dark">
            লগ ইন করুন
          </Link>
        </p>
      )}
    </div>
  );
}
