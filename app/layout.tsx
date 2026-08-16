import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import SiteChrome from '@/components/SiteChrome';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400', '500', '600', '700', '800'] });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', weight: ['600', '700'] });
const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-noto-bengali',
  weight: ['500', '600', '700']
});

export const metadata: Metadata = {
  title: "সাবিত গ্যাজেট | Sabit Gadget's Zone",
  description: 'Your trusted hub for unique gadgets and home tech.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className={`${inter.variable} ${jetbrains.variable} ${notoBengali.variable} font-sans antialiased`}>
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
