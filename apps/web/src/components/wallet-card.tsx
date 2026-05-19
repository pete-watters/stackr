'use client';

import Link from 'next/link';
import type { Wallet, Balance, Price, Currency } from '@stackr/models';
import { chainMeta } from '@stackr/models';
import { formatFiat, formatChange } from '@stackr/services';
import { ChainAvatar, ItemLayout, Skeleton, Badge } from '@stackr/ui';
import { Sparkline } from '@stackr/charts/react';
import { useEnsName } from '@/lib/ens-queries';

interface WalletCardProps {
  wallet: Wallet;
  balance?: Balance;
  isLoading?: boolean;
  price?: Price;
  sparklineData?: number[];
  currency?: Currency;
  connected?: boolean;
}

export function WalletCard({
  wallet,
  balance,
  isLoading,
  price,
  sparklineData,
  currency = 'usd',
  connected = false,
}: WalletCardProps) {
  const meta = chainMeta[wallet.chain];
  const truncatedAddress = `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`;

  const { data: ensName } = useEnsName(
    wallet.chain === 'eth' ? (wallet.address as `0x${string}`) : undefined,
  );

  const fiatValue = balance && price ? parseFloat(balance.balance) * price.fiatPrice : undefined;

  return (
    <Link
      href={`/wallet/${wallet.chain}/${wallet.address}`}
      className="block rounded-lg border bg-card p-4 transition-colors hover:border-ring"
    >
      <div className="flex items-center gap-3">
        <ChainAvatar chain={wallet.chain} size="md" />
        <ItemLayout
          titleLeft={
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">{wallet.label}</span>
              {connected && (
                <Badge variant="info" className="px-1.5 py-0 text-[10px]">
                  Connected
                </Badge>
              )}
            </div>
          }
          captionLeft={
            <span className="text-xs text-muted-foreground">
              {meta.name} &middot; <span className="font-mono">{ensName ?? truncatedAddress}</span>
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
            ) : fiatValue !== undefined ? (
              <span className="text-xs text-muted-foreground">
                {formatFiat(fiatValue, currency)}
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
