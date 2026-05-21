'use client';

import { useState } from 'react';
import { useOrderbook } from '@stackr/queries';
import { DepthChart } from '@stackr/charts/react';
import { Header } from '@/components/header';
import { Orderbook } from '@/components/orderbook';
import { Skeleton, Card } from '@stackr/ui';

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
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Market</h1>
          <div className="flex items-center gap-2">
            <select
              value={selectedPair.value}
              onChange={e => {
                const found = pairs.find(p => p.value === e.target.value);
                if (found) setSelectedPair(found);
              }}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold"
            >
              {pairs.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setMode(m => (m === 'mock' ? 'live' : 'mock'))}
              className={`px-3 py-2 rounded-md border text-xs cursor-pointer transition-colors ${
                mode === 'live'
                  ? 'bg-success/15 border-success/30 text-success'
                  : 'bg-secondary border-input text-muted-foreground'
              }`}
            >
              {mode === 'live' ? 'Live' : 'Mock'}
            </button>
          </div>
        </div>

        {!orderbook ? (
          <div className="flex gap-4">
            <Skeleton width="50%" height={400} />
            <Skeleton width="50%" height={400} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Orderbook orderbook={orderbook} />
            <Card className="p-4">
              <div className="text-sm font-semibold mb-3">Depth Chart — {selectedPair.label}</div>
              <DepthChart
                bids={orderbook.bids}
                asks={orderbook.asks}
                dimensions={{ height: 300 }}
              />
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
