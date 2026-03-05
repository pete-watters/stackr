'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChainSchema, chainMeta } from '@stackr/models';
import type { Chain } from '@stackr/models';
import { useBalance } from '@stackr/queries';
import { useWalletStore } from '@/lib/wallet-store';
import { Header } from '@/components/header';
import { css } from 'styled-system/css';

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
      <>
        <Header />
        <main
          className={css({
            maxW: '48rem',
            mx: 'auto',
            p: 'space.05',
            px: 'space.04',
            textAlign: 'center',
          })}
        >
          <p className={css({ color: 'error.text' })}>Invalid chain: {chainParam}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={css({ maxW: '48rem', mx: 'auto', p: 'space.05', px: 'space.04' })}>
        <Link href="/" className={css({ textStyle: 'label.01', color: 'accent.text' })}>
          &larr; Back to Portfolio
        </Link>

        <div className={css({ mt: 'space.05' })}>
          <h1 className={css({ textStyle: 'heading.02' })}>{wallet?.label ?? 'Wallet'}</h1>
          <p className={css({ textStyle: 'body.02', color: 'ink.text-secondary', mt: 'space.01' })}>
            {meta.name} &middot; <span className={css({ fontFamily: 'mono' })}>{address}</span>
          </p>
        </div>

        <div
          className={css({
            mt: 'space.05',
            p: 'space.05',
            bg: 'ink.component-bg-default',
            borderRadius: 'lg',
            border: '1px solid',
            borderColor: 'ink.border-subtle',
          })}
        >
          <div
            className={css({ textStyle: 'label.02', color: 'ink.text-secondary', mb: 'space.02' })}
          >
            Balance
          </div>
          {isLoading ? (
            <div className={css({ textStyle: 'body.01', color: 'ink.text-muted' })}>Loading...</div>
          ) : error ? (
            <div className={css({ textStyle: 'body.01', color: 'error.text' })}>
              Failed to load balance
            </div>
          ) : balance ? (
            <div className={css({ textStyle: 'mono.01' })}>
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
            className={css({
              mt: 'space.06',
              px: 'space.04',
              py: 'space.02',
              bg: 'transparent',
              color: 'error.text',
              border: '1px solid',
              borderColor: 'error.border',
              borderRadius: 'md',
              cursor: 'pointer',
              textStyle: 'label.01',
              _hover: { bg: 'error.bg-subtle' },
            })}
          >
            Remove Wallet
          </button>
        )}
      </main>
    </>
  );
}
