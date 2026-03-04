'use client';

import Link from 'next/link';
import type { Wallet, Balance } from '@stackr/models';
import { chainMeta } from '@stackr/models';

interface WalletCardProps {
  wallet: Wallet;
  balance?: Balance;
  isLoading?: boolean;
}

export function WalletCard({ wallet, balance, isLoading }: WalletCardProps) {
  const meta = chainMeta[wallet.chain];
  const truncatedAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;

  return (
    <Link
      href={`/wallet/${wallet.chain}/${wallet.address}`}
      style={{
        display: 'block',
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid #404040',
        backgroundColor: '#2B2B2B',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, color: '#fafafa' }}>{wallet.label}</div>
          <div style={{ fontSize: '0.75rem', color: '#a3a3a3', marginTop: '0.25rem' }}>
            {meta.name} &middot; {truncatedAddress}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {isLoading ? (
            <div style={{ color: '#737373', fontSize: '0.875rem' }}>Loading...</div>
          ) : balance ? (
            <div style={{ fontWeight: 600, color: '#fafafa' }}>
              {balance.balance} {meta.symbol}
            </div>
          ) : (
            <div style={{ color: '#737373', fontSize: '0.875rem' }}>&mdash;</div>
          )}
        </div>
      </div>
    </Link>
  );
}
