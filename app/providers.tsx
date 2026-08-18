'use client';

import { ReactNode, Suspense } from 'react';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { UserProvider } from '@/contexts/UserContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import TopLoadingBar from '@/components/TopLoadingBar';
import SplashScreen from '@/components/SplashScreen';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <UserProvider>
        <NotificationProvider>
          <CartProvider>
            <WishlistProvider>
              <SplashScreen />
              <Suspense fallback={null}>
                <TopLoadingBar />
              </Suspense>
              {children}
            </WishlistProvider>
          </CartProvider>
        </NotificationProvider>
      </UserProvider>
    </SessionProvider>
  );
}
