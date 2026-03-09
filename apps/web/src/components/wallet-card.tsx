'use client';

import Link from 'next/link';
import type { Wallet, Balance, Price } from '@stackr/models';
import { chainMeta } from '@stackr/models';
import { formatUsd, formatChange } from '@stackr/services';
import { ChainAvatar, ItemLayout, Skeleton } from '@stackr/ui';
import { Sparkline } from '@stackr/charts/react';

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
      className="block rounded-lg border bg-card p-4 transition-colors hover:border-ring"
    >
      <div className="flex items-center gap-3">
        <ChainAvatar chain={wallet.chain} size="md" />
        <ItemLayout
          titleLeft={<span className="text-sm font-semibold text-foreground">{wallet.label}</span>}
          captionLeft={
            <span className="text-xs text-muted-foreground">
              {meta.name} &middot; <span className="font-mono">{truncatedAddress}</span>
            </span>
          }
          titleRight={
            isLoading ? (
              <Skeleton width={80} height="1.25em" />
            ) : balance ? (
              <div className="flex items-center gap-2">
                {sparklineData && sparklineData.length >= 2 && (
                  <Sparkline data={sparklineData} width={60} height={20} strokeWidth={1} />
                )}
                <span className="font-mono text-sm text-foreground">
                  {balance.balance} {meta.symbol}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">&mdash;</span>
            )
          }
          captionRight={
            isLoading ? (
              <Skeleton width={60} height="0.875em" />
            ) : usdValue !== undefined ? (
              <span className="text-xs text-muted-foreground">
                {formatUsd(usdValue)}
                {price && (
                  <span
                    className={`ml-1 ${price.change24h >= 0 ? 'text-success' : 'text-destructive'}`}
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
