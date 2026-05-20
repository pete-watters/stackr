import type { Metadata, Viewport } from 'next';
import { Providers } from '@/lib/providers';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://stackr.ie'),
  title: 'Stackr — Multi-Chain Portfolio Tracker',
  description:
    'Cross-chain Web3 portfolio for self-custody. Track BTC, ETH, STX, and SOL wallet balances in one place.',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    url: 'https://stackr.ie',
    siteName: 'Stackr',
    title: 'Stackr — Multi-Chain Portfolio Tracker',
    description: 'Cross-chain Web3 portfolio for self-custody.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stackr — Multi-Chain Portfolio Tracker',
    description: 'Cross-chain Web3 portfolio for self-custody.',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1a1a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
