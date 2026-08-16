'use client';

import { useState } from 'react';

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
      <span aria-hidden className="flex-shrink-0 text-muted">
        🔒
      </span>
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
        className="flex-shrink-0 text-sm text-muted hover:text-navy"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? '🙈' : '👁️'}
      </button>
    </div>
  );
}
