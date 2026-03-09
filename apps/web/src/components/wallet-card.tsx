'use client';

import Link from 'next/link';
import type { Wallet, Balance, Price } from '@stackr/models';
import { chainMeta } from '@stackr/models';
import { formatUsd, formatChange } from '@stackr/services';
import { ChainAvatar, ItemLayout, Skeleton } from '@stackr/ui';
import { Sparkline } from '@stackr/charts/react';
import { css } from 'styled-system/css';

interface WalletCardProps {
  wallet: Wallet;
  balance?: Balance;
  isLoading?: boolean;
  price?: Price;
  sparklineData?: number[];
}

export function WalletCard({ wallet, balance, isLoading, price, sparklineData }: WalletCardProps) {
  const meta = chainMeta[wallet.chain];
  const truncatedAddress = `${wallet.address.slice(0, 6)}\u2026${wallet.address.slice(-4)}`;

  const usdValue = balance && price ? parseFloat(balance.balance) * price.usdPrice : undefined;

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
      <div className={css({ display: 'flex', alignItems: 'center', gap: 'space.03' })}>
        <ChainAvatar chain={wallet.chain} size="md" />
        <ItemLayout
          titleLeft={
            <span className={css({ textStyle: 'label.01', color: 'ink.text-primary' })}>
              {wallet.label}
            </span>
          }
          captionLeft={
            <span className={css({ textStyle: 'caption.01', color: 'ink.text-secondary' })}>
              {meta.name} &middot;{' '}
              <span className={css({ fontFamily: 'mono' })}>{truncatedAddress}</span>
            </span>
          }
          titleRight={
            isLoading ? (
              <Skeleton width={80} height="1.25em" className="skeleton" />
            ) : balance ? (
              <div className={css({ display: 'flex', alignItems: 'center', gap: 'space.02' })}>
                {sparklineData && sparklineData.length >= 2 && (
                  <Sparkline data={sparklineData} width={60} height={20} strokeWidth={1} />
                )}
                <span className={css({ textStyle: 'mono.02', color: 'ink.text-primary' })}>
                  {balance.balance} {meta.symbol}
                </span>
              </div>
            ) : (
              <span className={css({ textStyle: 'body.02', color: 'ink.text-muted' })}>
                &mdash;
              </span>
            )
          }
          captionRight={
            isLoading ? (
              <Skeleton width={60} height="0.875em" className="skeleton" />
            ) : usdValue !== undefined ? (
              <span className={css({ textStyle: 'caption.01', color: 'ink.text-secondary' })}>
                {formatUsd(usdValue)}
                {price && (
                  <span
                    className={css({
                      ml: 'space.01',
                      color: price.change24h >= 0 ? 'success.text' : 'error.text',
                    })}
                  >
                    {formatChange(price.change24h)}
                  </span>
                )}
              </span>
            ) : undefined
          }
        />
      </div>
    </Link>
  );
}
