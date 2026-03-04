'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChainSchema, chainMeta } from '@stackr/models';
import type { Chain } from '@stackr/models';
import { useBalance } from '@stackr/queries';
import { useWalletStore } from '@/lib/wallet-store';
import { Header } from '@/components/header';

export default function WalletDetailPage({
  params,
}: {
  params: Promise<{ chain: string; address: string }>;
}) {
  const { chain: chainParam, address } = use(params);
  const chainResult = ChainSchema.safeParse(chainParam);
  const chain: Chain = chainResult.success ? chainResult.data : 'btc';
  const meta = chainMeta[chain];

  const wallet = useWalletStore(s =>
    s.wallets.find(w => w.chain === chain && w.address === address),
  );
  const removeWallet = useWalletStore(s => s.removeWallet);
  const { data: balance, isLoading, error } = useBalance(chain, address);

  if (!chainResult.success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0d0d0d', color: '#fafafa' }}>
        <Header />
        <main
          style={{
            maxWidth: '48rem',
            margin: '0 auto',
            padding: '2rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#ef4444' }}>Invalid chain: {chainParam}</p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d0d0d', color: '#fafafa' }}>
      <Header />
      <main style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <Link href="/" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}>
          &larr; Back to Portfolio
        </Link>

        <div style={{ marginTop: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{wallet?.label ?? 'Wallet'}</h1>
          <p style={{ color: '#a3a3a3', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {meta.name} &middot;{' '}
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{address}</span>
          </p>
        </div>

        <div
          style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            backgroundColor: '#2B2B2B',
            borderRadius: '12px',
            border: '1px solid #404040',
          }}
        >
          <div style={{ fontSize: '0.875rem', color: '#a3a3a3', marginBottom: '0.5rem' }}>
            Balance
          </div>
          {isLoading ? (
            <div style={{ color: '#737373' }}>Loading...</div>
          ) : error ? (
            <div style={{ color: '#ef4444' }}>Failed to load balance</div>
          ) : balance ? (
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
              {balance.balance} {meta.symbol}
            </div>
          ) : null}
        </div>

        {wallet && (
          <button
            onClick={() => {
              removeWallet(wallet.id);
              window.location.href = '/';
            }}
            style={{
              marginTop: '2rem',
              padding: '0.625rem 1rem',
              backgroundColor: 'transparent',
              color: '#ef4444',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Remove Wallet
          </button>
        )}
      </main>
    </div>
  );
}
