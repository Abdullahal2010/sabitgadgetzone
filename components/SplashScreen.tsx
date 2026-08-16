'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

// Shown once per hard page load (this component lives at the root layout,
// which only mounts on a real navigation/reload — not on client-side route
// changes within the app), then fades out. Purely cosmetic; doesn't block
// interaction since it's non-interactive and removed from the DOM once hidden.
export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 700);
    const removeTimer = setTimeout(() => setVisible(false), 1050);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-navy transition-opacity duration-300 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-card-lg">
        <Image src="/logo.png" alt="Sabit Gadget's Zone" width={64} height={64} className="h-full w-full object-cover" />
      </span>
      <p className="text-sm font-semibold tracking-wide text-white/70">সাবিত গ্যাজেট লোড হচ্ছে…</p>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-white/15">
        <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-teal to-brand [animation:splash-slide_1s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
