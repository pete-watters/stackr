'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Wallet, Transaction, Chain } from '@stackr/models';
import { chainMeta } from '@stackr/models';
import { getExplorerUrl } from '@stackr/services';
import { useTransactions } from '@stackr/queries';
import { Card, Skeleton, ChainAvatar } from '@stackr/ui';

interface Reported {
  chain: Chain;
  txs: Transaction[];
  loading: boolean;
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

/**
 * Each wallet's transactions are fetched by its own child instance so the
 * `useTransactions` hook is always called unconditionally (one per wallet),
 * and reported up for merging into a single chronological feed.
 */
function WalletActivityFetcher({
  wallet,
  onData,
}: {
  wallet: Wallet;
  onData: (id: string, reported: Reported) => void;
}) {
  const { data, isLoading } = useTransactions(wallet.chain, wallet.address);
  useEffect(() => {
    onData(wallet.id, { chain: wallet.chain, txs: data ?? [], loading: isLoading });
  }, [wallet.id, wallet.chain, data, isLoading, onData]);
  return null;
}

export function RecentActivity({ wallets }: { wallets: Wallet[] }) {
  const [byWallet, setByWallet] = useState<Record<string, Reported>>({});

  const onData = useCallback((id: string, reported: Reported) => {
    setByWallet(prev => ({ ...prev, [id]: reported }));
  }, []);

  if (wallets.length === 0) return null;

  const entries = Object.values(byWallet)
    .flatMap(({ chain, txs }) => txs.map(tx => ({ tx, chain })))
    .sort((a, b) => new Date(b.tx.timestamp).getTime() - new Date(a.tx.timestamp).getTime())
    .slice(0, 8);

  const reportedCount = Object.keys(byWallet).length;
  const stillLoading =
    reportedCount < wallets.length || Object.values(byWallet).some(w => w.loading);

  return (
    <Card className="mt-4 overflow-hidden">
      {wallets.map(w => (
        <WalletActivityFetcher key={w.id} wallet={w} onData={onData} />
      ))}

      <div className="border-b p-4 text-sm font-semibold">Recent activity</div>
      <div className="p-2">
        {stillLoading && entries.length === 0 ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={40} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No transactions found yet.
          </p>
        ) : (
          <ul className="flex flex-col">
            {entries.map(({ tx, chain }) => {
              const meta = chainMeta[chain];
              const received = tx.type === 'receive';
              return (
                <li key={`${chain}:${tx.hash}`}>
                  <a
                    href={getExplorerUrl(chain, 'tx', tx.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-md p-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <ChainAvatar chain={chain} size="sm" />
                      <span
                        className={`text-sm font-medium ${received ? 'text-success' : 'text-destructive'}`}
                      >
                        {received ? '↓ Received' : '↑ Sent'}
                      </span>
                      {!tx.confirmed && (
                        <span className="rounded-sm bg-warning/15 px-1 text-xs text-warning">
                          Pending
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span
                        className={`font-mono text-xs ${received ? 'text-success' : 'text-foreground'}`}
                      >
                        {received ? '+' : '−'}
                        {tx.amount} {meta.symbol}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(tx.timestamp)}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
