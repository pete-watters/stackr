'use client';

import { useState } from 'react';
import { useOrderbook } from '@stackr/queries';
import { DepthChart } from '@stackr/charts/react';
import { Header } from '@/components/header';
import { Orderbook } from '@/components/orderbook';
import { Skeleton } from '@stackr/ui';
import { css } from 'styled-system/css';

const pairs = [
  { label: 'BTC/USD', value: 'BTC/USD', midPrice: 50000 },
  { label: 'ETH/USD', value: 'ETH/USD', midPrice: 3000 },
  { label: 'SOL/USD', value: 'SOL/USD', midPrice: 150 },
  { label: 'STX/USD', value: 'STX/USD', midPrice: 2 },
];

export default function MarketPage() {
  const [selectedPair, setSelectedPair] = useState(pairs[0]);
  const [mode, setMode] = useState<'mock' | 'live'>('mock');

  const { orderbook } = useOrderbook({
    pair: selectedPair.value,
    mode,
    midPrice: selectedPair.midPrice,
  });

  return (
    <>
      <Header />
      <main className={css({ maxW: '72rem', mx: 'auto', p: 'space.05', px: 'space.04' })}>
        <div
          className={css({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 'space.05',
          })}
        >
          <h1 className={css({ textStyle: 'heading.02' })}>Market</h1>
          <div className={css({ display: 'flex', gap: 'space.02', alignItems: 'center' })}>
            <select
              value={selectedPair.value}
              onChange={e => {
                const found = pairs.find(p => p.value === e.target.value);
                if (found) setSelectedPair(found);
              }}
              className={css({
                px: 'space.03',
                py: 'space.02',
                bg: 'ink.bg-primary',
                border: '1px solid',
                borderColor: 'ink.border-default',
                borderRadius: 'md',
                color: 'ink.text-primary',
                textStyle: 'label.01',
              })}
            >
              {pairs.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setMode(m => (m === 'mock' ? 'live' : 'mock'))}
              className={css({
                px: 'space.03',
                py: 'space.02',
                bg: mode === 'live' ? 'success.bg-subtle' : 'ink.component-bg-default',
                border: '1px solid',
                borderColor: mode === 'live' ? 'success.border' : 'ink.border-default',
                borderRadius: 'md',
                color: mode === 'live' ? 'success.text' : 'ink.text-secondary',
                textStyle: 'caption.01',
                cursor: 'pointer',
              })}
            >
              {mode === 'live' ? 'Live' : 'Mock'}
            </button>
          </div>
        </div>

        {!orderbook ? (
          <div className={css({ display: 'flex', gap: 'space.04' })}>
            <Skeleton width="50%" height={400} className="skeleton" />
            <Skeleton width="50%" height={400} className="skeleton" />
          </div>
        ) : (
          <div
            className={css({
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'space.04',
              lg: { gridTemplateColumns: '1fr 1fr' },
              smDown: { gridTemplateColumns: '1fr' },
            })}
          >
            <Orderbook orderbook={orderbook} />
            <div
              className={css({
                bg: 'ink.component-bg-default',
                borderRadius: 'lg',
                border: '1px solid',
                borderColor: 'ink.border-subtle',
                p: 'space.03',
              })}
            >
              <div className={css({ textStyle: 'label.01', mb: 'space.03' })}>
                Depth Chart — {selectedPair.label}
              </div>
              <DepthChart
                bids={orderbook.bids}
                asks={orderbook.asks}
                dimensions={{ width: 500, height: 300 }}
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
