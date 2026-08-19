'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// A lightweight, dependency-free version of the "YouTube/GitHub style" top
// loading bar. Two triggers keep it honest:
//  1. A capturing click listener on same-origin <a> links starts the bar
//     immediately — before Next.js has even requested the new route — so it
//     doesn't lag behind the click.
//  2. Whenever the actual URL (pathname/query) changes, the navigation has
//     finished rendering, so the bar completes and fades out.
// Programmatic navigation (router.push from a button, not a link) won't hit
// trigger 1, but still resolves correctly once trigger 2 fires.
function TopLoadingBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    function clearTimers() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    }

    function start() {
      clearTimers();
      setVisible(true);
      setProgress(15);
      intervalRef.current = setInterval(() => {
        setProgress((p) => (p < 88 ? p + (88 - p) * 0.15 : p));
      }, 150);
    }

    function handleClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      } catch {
        return;
      }

      start();
    }

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    // Skip on mount — only react to actual route changes.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[100] h-[5px] w-full bg-navy/10">
      <div
        className="h-full bg-gradient-to-r from-teal via-brand to-brand-dark shadow-[0_0_16px_rgba(14,143,196,0.85)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default function TopLoadingBar() {
  return <TopLoadingBarInner />;
}
