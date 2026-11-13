import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { getSiteSettings } from '@/lib/db';
import { CartProvider } from '@/components/CartProvider';
import { SiteShell } from '@/components/SiteShell';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono-code',
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CHAI WALA | Authentic Taste… Now in the UK!',
  description:
    'TEA • TRADITION • GOOD MOOD — Bringing the warmth, richness and tradition of authentic desi chai to tea lovers across the United Kingdom.',
  openGraph: {
    title: 'CHAI WALA | Authentic Taste… Now in the UK!',
    description:
      'TEA • TRADITION • GOOD MOOD — Bringing the warmth, richness and tradition of authentic desi chai to tea lovers across the United Kingdom.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CHAI WALA | Authentic Taste… Now in the UK!',
    description:
      'TEA • TRADITION • GOOD MOOD — Bringing the warmth, richness and tradition of authentic desi chai to tea lovers across the United Kingdom.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = getSiteSettings();

  return (
    <html
      lang="en-GB"
      className={`${playfair.variable} ${jakarta.variable} ${mono.variable}`}
    >
      <body suppressHydrationWarning className="font-sans antialiased">
        <CartProvider>
          <SiteShell settings={settings}>{children}</SiteShell>
        </CartProvider>
      </body>
    </html>
  );
}
