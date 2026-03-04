'use client';

import Link from 'next/link';
import { useWalletStore } from '@/lib/wallet-store';
import { useBalances } from '@stackr/queries';
import { Header } from '@/components/header';
import { WalletCard } from '@/components/wallet-card';

export default function DashboardPage() {
  const wallets = useWalletStore(s => s.wallets);
  const balanceQueries = useBalances(wallets);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d0d0d', color: '#fafafa' }}>
      <Header />
      <main style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Portfolio</h1>
          <Link
            href="/wallet/add"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            + Add Wallet
          </Link>
        </div>

        {wallets.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              border: '1px dashed #404040',
              borderRadius: '12px',
              color: '#737373',
            }}
          >
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No wallets yet</p>
            <p style={{ fontSize: '0.875rem' }}>
              Add your first wallet to start tracking your portfolio.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {wallets.map((wallet, i) => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                balance={balanceQueries[i]?.data}
                isLoading={balanceQueries[i]?.isLoading}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
