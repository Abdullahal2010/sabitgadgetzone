'use client';

import { useEffect, useRef, useState } from 'react';

const LENGTH = 6;

/**
 * Six separate square boxes for a numeric code, left to right.
 *
 * - Typing a digit auto-advances focus to the next box.
 * - Backspace on an empty box moves focus back and clears the previous box.
 * - Pasting anything containing 6+ digits anywhere in the boxes fills all
 *   of them correctly, wherever the paste happened.
 * - The moment the 6th digit is entered, onComplete fires automatically —
 *   no submit button needed.
 * - When `resetSignal` changes (e.g. the parent got a "wrong code" error
 *   back from the server), every box clears and focus returns to the
 *   first box — the "restart from the beginning" behavior on failure.
 */
export default function OtpInput({
  onComplete,
  resetSignal,
  disabled
}: {
  onComplete: (code: string) => void;
  resetSignal?: unknown;
  disabled?: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Guards against onComplete firing twice for the same code (e.g. a
  // paste event and the subsequent change event both completing the code).
  const firedRef = useRef(false);

  useEffect(() => {
    setDigits(Array(LENGTH).fill(''));
    firedRef.current = false;
    inputRefs.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  function commit(next: string[]) {
    setDigits(next);
    const joined = next.join('');
    if (joined.length === LENGTH && !next.includes('') && !firedRef.current) {
      firedRef.current = true;
      onComplete(joined);
    }
  }

  function handleChange(index: number, raw: string) {
    const value = raw.replace(/\D/g, '');
    if (!value) {
      const next = [...digits];
      next[index] = '';
      commit(next);
      return;
    }

    // Handles both a single keystroke and a paste that landed in one box.
    const chars = value.split('');
    const next = [...digits];
    let cursor = index;
    for (const ch of chars) {
      if (cursor >= LENGTH) break;
      next[cursor] = ch;
      cursor += 1;
    }
    commit(next);

    const focusIndex = Math.min(cursor, LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
    inputRefs.current[focusIndex]?.select();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault();
      const next = [...digits];
      next[index - 1] = '';
      commit(next);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    e.preventDefault();
    handleChange(0, pasted);
  }

  return (
    <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-14 w-12 rounded-lg border-2 border-border bg-bg text-center text-2xl font-bold text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand disabled:opacity-60 sm:h-16 sm:w-14"
        />
      ))}
    </div>
  );
}
