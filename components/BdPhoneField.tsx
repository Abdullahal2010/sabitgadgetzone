'use client';

// Shared by the login and registration pages — a phone input styled with a
// small Bangladesh flag, matching the reference design for both.
export default function BdPhoneField({
  value,
  onChange,
  placeholder = '01XXXXXXXXX',
  autoFocus
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-bg px-3 py-2.5 focus-within:ring-2 focus-within:ring-brand">
      <span className="flex h-5 w-7 flex-shrink-0 items-center justify-center rounded-[2px] bg-[#006A4E]">
        <span className="h-2.5 w-2.5 rounded-full bg-[#F42A41]" />
      </span>
      <span className="h-4 w-px flex-shrink-0 bg-border" />
      <input
        type="tel"
        required
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-muted"
      />
    </div>
  );
}
