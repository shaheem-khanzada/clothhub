import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';

import { catalogue } from '@/content/site';

import './globals.css';

// The variable cut of Bricolage Grotesque (weight, width and optical size), so
// large headlines get the tighter display shapes automatically.
const bricolage = localFont({
  src: '../fonts/BricolageGrotesque-latin.woff2',
  variable: '--font-bricolage',
  weight: '200 800',
  display: 'swap',
});

const description = `ClothHub brings Pakistan’s women’s fashion from ${catalogue.brandCount} brands into one beautiful scroll. Save what you love, share it with your people, and buy it straight from the brand.`;

export const metadata: Metadata = {
  title: 'ClothHub — Every brand you love. One feed.',
  description,
  openGraph: {
    type: 'website',
    siteName: 'ClothHub',
    title: 'ClothHub — Every brand you love. One feed.',
    description,
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0b0c',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body className="bg-ink font-sans text-white">
        {/* Tilted photos poke past the screen edge on phones; clip them without a sideways scroll. */}
        <div className="overflow-x-clip">{children}</div>
      </body>
    </html>
  );
}
