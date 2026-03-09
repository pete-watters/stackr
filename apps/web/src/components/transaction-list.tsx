'use client';

import type { Transaction, Chain } from '@stackr/models';
import { chainMeta } from '@stackr/models';
import { getExplorerUrl } from '@stackr/services';
import { ItemLayout, Skeleton } from '@stackr/ui';
import { css } from 'styled-system/css';

interface TransactionListProps {
  transactions: Transaction[];
  chain: Chain;
  isLoading: boolean;
}

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(isoDate).toLocaleDateString();
}

export function TransactionList({ transactions, chain, isLoading }: TransactionListProps) {
  const meta = chainMeta[chain];

  if (isLoading) {
    return (
      <div className={css({ display: 'flex', flexDirection: 'column', gap: 'space.02' })}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={48} className="skeleton" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div
        className={css({
          textStyle: 'body.02',
          color: 'ink.text-muted',
          py: 'space.04',
          textAlign: 'center',
        })}
      >
        No transactions found
      </div>
    );
  }

  return (
    <div className={css({ display: 'flex', flexDirection: 'column', gap: 'space.01' })}>
      {transactions.map(tx => (
        <a
          key={tx.hash}
          href={getExplorerUrl(chain, 'tx', tx.hash)}
          target="_blank"
          rel="noopener noreferrer"
          className={css({
            display: 'block',
            p: 'space.03',
            borderRadius: 'md',
            transition: 'background 0.1s ease',
            _hover: { bg: 'ink.component-bg-hover' },
          })}
        >
          <ItemLayout
            titleLeft={
              <div className={css({ display: 'flex', alignItems: 'center', gap: 'space.02' })}>
                <span
                  className={css({
                    textStyle: 'label.02',
                    color: tx.type === 'receive' ? 'success.text' : 'error.text',
                  })}
                >
                  {tx.type === 'receive' ? '\u2193 Received' : '\u2191 Sent'}
                </span>
                {!tx.confirmed && (
                  <span
                    className={css({
                      textStyle: 'caption.01',
                      color: 'warning.text',
                      bg: 'warning.bg-subtle',
                      px: 'space.01',
                      borderRadius: 'sm',
                    })}
                  >
                    Pending
                  </span>
                )}
              </div>
            }
            captionLeft={
              <span className={css({ textStyle: 'caption.01', color: 'ink.text-muted' })}>
                {tx.counterparty !== 'unknown' ? (
                  <span className={css({ fontFamily: 'mono' })}>
                    {tx.counterparty.slice(0, 8)}&hellip;{tx.counterparty.slice(-4)}
                  </span>
                ) : (
                  'Unknown'
                )}
              </span>
            }
            titleRight={
              <span
                className={css({
                  textStyle: 'mono.03',
                  color: tx.type === 'receive' ? 'success.text' : 'ink.text-primary',
                })}
              >
                {tx.type === 'receive' ? '+' : '-'}
                {tx.amount} {meta.symbol}
              </span>
            }
            captionRight={
              <span className={css({ textStyle: 'caption.01', color: 'ink.text-muted' })}>
                {formatRelativeTime(tx.timestamp)}
              </span>
            }
          />
        </a>
      ))}
    </div>
  );
}
