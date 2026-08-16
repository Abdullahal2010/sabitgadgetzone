'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

// /admin/* renders its own chrome (see app/admin/layout.tsx) so it isn't
// wrapped in the storefront header, search bar and footer.
export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1560px] px-5 py-5">{children}</main>
      <Footer />
    </>
  );
}
