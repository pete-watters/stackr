'use client';

import Link from 'next/link';
import type { Wallet, Balance } from '@stackr/models';
import { chainMeta } from '@stackr/models';
import { css } from 'styled-system/css';

interface WalletCardProps {
  wallet: Wallet;
  balance?: Balance;
  isLoading?: boolean;
}

export function WalletCard({ wallet, balance, isLoading }: WalletCardProps) {
  const meta = chainMeta[wallet.chain];
  const truncatedAddress = `${wallet.address.slice(0, 6)}\u2026${wallet.address.slice(-4)}`;

  return (
    <Link
      href={`/wallet/${wallet.chain}/${wallet.address}`}
      className={css({
        display: 'block',
        p: 'space.04',
        borderRadius: 'lg',
        border: '1px solid',
        borderColor: 'ink.border-subtle',
        bg: 'ink.component-bg-default',
        transition: 'all 0.15s ease',
        _hover: { borderColor: 'accent.border' },
      })}
    >
      <div
        className={css({
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        })}
      >
        <div>
          <div className={css({ textStyle: 'label.01', color: 'ink.text-primary' })}>
            {wallet.label}
          </div>
          <div
            className={css({
              textStyle: 'caption.01',
              color: 'ink.text-secondary',
              mt: 'space.01',
            })}
          >
            {meta.name} &middot;{' '}
            <span className={css({ fontFamily: 'mono' })}>{truncatedAddress}</span>
          </div>
        </div>
        <div className={css({ textAlign: 'right' })}>
          {isLoading ? (
            <span className={css({ textStyle: 'body.02', color: 'ink.text-muted' })}>
              Loading...
            </span>
          ) : balance ? (
            <span className={css({ textStyle: 'mono.02', color: 'ink.text-primary' })}>
              {balance.balance} {meta.symbol}
            </span>
          ) : (
            <span className={css({ textStyle: 'body.02', color: 'ink.text-muted' })}>&mdash;</span>
          )}
        </div>
      </div>
    </Link>
  );
}
