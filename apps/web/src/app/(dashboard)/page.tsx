'use client';

import Link from 'next/link';
import { useWalletStore } from '@/lib/wallet-store';
import { useBalances } from '@stackr/queries';
import { Header } from '@/components/header';
import { WalletCard } from '@/components/wallet-card';
import { css } from 'styled-system/css';

export default function DashboardPage() {
  const wallets = useWalletStore(s => s.wallets);
  const balanceQueries = useBalances(wallets);

  return (
    <>
      <Header />
      <main className={css({ maxW: '48rem', mx: 'auto', p: 'space.05', px: 'space.04' })}>
        <div
          className={css({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 'space.05',
          })}
        >
          <h1 className={css({ textStyle: 'heading.02' })}>Portfolio</h1>
          <Link
            href="/wallet/add"
            className={css({
              display: 'inline-flex',
              alignItems: 'center',
              px: 'space.04',
              py: 'space.02',
              bg: 'accent.solid-default',
              color: 'white',
              borderRadius: 'md',
              textStyle: 'label.01',
              _hover: { bg: 'accent.solid-hover' },
            })}
          >
            + Add Wallet
          </Link>
        </div>

        {wallets.length === 0 ? (
          <div
            className={css({
              textAlign: 'center',
              py: 'space.09',
              px: 'space.05',
              border: '1px dashed',
              borderColor: 'ink.border-subtle',
              borderRadius: 'lg',
              color: 'ink.text-muted',
            })}
          >
            <p className={css({ textStyle: 'body.01', mb: 'space.02' })}>No wallets yet</p>
            <p className={css({ textStyle: 'body.02' })}>
              Add your first wallet to start tracking your portfolio.
            </p>
          </div>
        ) : (
          <div className={css({ display: 'flex', flexDirection: 'column', gap: 'space.03' })}>
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
    </>
  );
}
