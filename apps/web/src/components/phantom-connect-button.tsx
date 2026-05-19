'use client';

import dynamic from 'next/dynamic';
import type { ComponentType, ButtonHTMLAttributes } from 'react';

// The wallet-adapter UI touches `window` during render; load on the client only
// to keep SSR clean and avoid hydration mismatches.
export const PhantomConnectButton: ComponentType<ButtonHTMLAttributes<HTMLButtonElement>> = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(m => m.WalletMultiButton),
  { ssr: false },
);
