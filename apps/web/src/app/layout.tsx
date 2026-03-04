import type { Metadata, Viewport } from 'next';
import { Providers } from '@/lib/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stackr — Multi-Chain Portfolio Tracker',
  description: 'Track your BTC, STX, ETH, and SOL wallet balances in one place.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#2B2B2B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
