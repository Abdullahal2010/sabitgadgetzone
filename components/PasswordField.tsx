'use client';

import { useState } from 'react';

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 10.5V7.5a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.5 3.5l17 17M10.6 10.7a2.75 2.75 0 0 0 3.9 3.9M7.4 7.6C4.9 9.1 3 12 3 12s3.5 6.5 9.5 6.5c1.6 0 3-.4 4.2-1.1M16.5 16.6C19.4 15 21.5 12 21.5 12s-1.7-3.2-5.2-5.1c-1.4-.75-3-1.15-4.3-1.15c-.85 0-1.75.15-2.65.45"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Shared by the login and registration pages.
export default function PasswordField({
  value,
  onChange,
  placeholder = '••••••',
  autoComplete
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex items-center gap-2 rounded-lg bg-bg px-3 py-2.5 focus-within:ring-2 focus-within:ring-brand">
      <LockIcon className="h-4 w-4 flex-shrink-0 text-muted" />
      <input
        type={visible ? 'text' : 'password'}
        required
        minLength={6}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-muted"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="flex-shrink-0 text-muted hover:text-navy"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}
