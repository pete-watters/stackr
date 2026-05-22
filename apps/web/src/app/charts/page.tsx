'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PriceChart } from '@stackr/charts/react';
import type { DataPoint } from '@stackr/charts';
import { usePriceHistory, useStockPriceHistory } from '@stackr/queries';
import { formatFiat, formatChange } from '@stackr/services';
import type { Chain, Currency } from '@stackr/models';
import { Card, Skeleton, Callout } from '@stackr/ui';
import { Header } from '@/components/header';
import { useWalletStore } from '@/lib/wallet-store';
import { useHoldingsStore } from '@/lib/holdings-store';
import { useSettingsStore } from '@/lib/settings-store';
import {
  CHART_RANGES,
  assetId,
  buildAssetOptions,
  findAsset,
  formatAxisTime,
  isRangeAllowed,
  toDataPoints,
} from '@/lib/chart-assets';

interface ChartBodyProps {
  needsStockKey: boolean;
  isLoading: boolean;
  points: DataPoint[];
  currency: Currency;
  rangeDays: number;
}

function ChartBody({ needsStockKey, isLoading, points, currency, rangeDays }: ChartBodyProps) {
  if (needsStockKey) {
    return (
      <Callout variant="warning">
        Add your Alpha Vantage API key in{' '}
        <Link href="/settings" className="underline">
          Settings
        </Link>{' '}
        to chart stock prices.
      </Callout>
    );
  }
  if (isLoading) {
    return <Skeleton width="100%" height={360} />;
  }
  if (points.length < 2) {
    return (
      <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
        No price data available.
      </div>
    );
  }
  return (
    <div data-testid="price-chart">
      <PriceChart
        data={points}
        height={360}
        formatValue={value => formatFiat(value, currency)}
        formatTime={ms => formatAxisTime(ms, rangeDays)}
      />
    </div>
  );
}

export default function ChartsPage() {
  const wallets = useWalletStore(s => s.wallets);
  const connectedAddresses = useWalletStore(s => s.connectedAddresses);
  const holdings = useHoldingsStore(s => s.holdings);
  const currency = useSettingsStore(s => s.currency);
  const alphaVantageApiKey = useSettingsStore(s => s.alphaVantageApiKey);

  const options = useMemo(() => {
    const walletChains = wallets.map(w => w.chain);
    const connectedChains = Object.keys(connectedAddresses) as Chain[];
    const stockSymbols = holdings
      .filter((h): h is Extract<typeof h, { type: 'stock' }> => h.type === 'stock')
      .map(h => h.symbol);
    return buildAssetOptions({ walletChains, connectedChains, stockSymbols });
  }, [wallets, connectedAddresses, holdings]);

  const [selectedId, setSelectedId] = useState('');
  const [rangeDays, setRangeDays] = useState(7);

  const selected = findAsset(options, selectedId) ?? options[0];
  const range = CHART_RANGES.find(r => r.days === rangeDays) ?? CHART_RANGES[1];

  // Stocks are daily-only — fall back off 24H whenever a stock becomes active.
  useEffect(() => {
    if (selected && !isRangeAllowed(selected, range)) {
      setRangeDays(7);
    }
  }, [selected, range]);

  const cryptoChain = selected?.kind === 'crypto' ? selected.chain : undefined;
  const stockSymbol = selected?.kind === 'stock' ? selected.symbol : undefined;
  const isStock = stockSymbol !== undefined;

  const cryptoQuery = usePriceHistory(cryptoChain ?? 'btc', rangeDays, currency, {
    enabled: cryptoChain !== undefined,
  });
  const stockQuery = useStockPriceHistory(stockSymbol ?? '', alphaVantageApiKey, rangeDays);

  const activeQuery = isStock ? stockQuery : cryptoQuery;
  const points = useMemo(
    () => (activeQuery.data ? toDataPoints(activeQuery.data) : []),
    [activeQuery.data],
  );

  const needsStockKey = isStock && alphaVantageApiKey.length === 0;
  const last = points[points.length - 1]?.y;
  const first = points[0]?.y;
  const changePct = first && last ? ((last - first) / first) * 100 : undefined;

  const cryptoOptions = options.filter(option => option.kind === 'crypto');
  const stockOptions = options.filter(option => option.kind === 'stock');

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Charts</h1>
          <select
            value={selected ? assetId(selected) : ''}
            onChange={e => setSelectedId(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold"
          >
            <optgroup label="Crypto">
              {cryptoOptions.map(option => (
                <option key={assetId(option)} value={assetId(option)}>
                  {option.label}
                </option>
              ))}
            </optgroup>
            {stockOptions.length > 0 && (
              <optgroup label="Stocks">
                {stockOptions.map(option => (
                  <option key={assetId(option)} value={assetId(option)}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div className="mb-4 flex items-center gap-2">
          {CHART_RANGES.map(r => {
            const allowed = selected ? isRangeAllowed(selected, r) : true;
            const active = r.days === rangeDays;
            return (
              <button
                key={r.label}
                onClick={() => setRangeDays(r.days)}
                disabled={!allowed}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  active
                    ? 'border-primary/30 bg-primary/15 text-primary'
                    : 'border-input bg-secondary text-muted-foreground hover:text-foreground'
                } ${allowed ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        <Card className="p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <div className="text-sm font-semibold">{selected?.label ?? '—'}</div>
            {last !== undefined && (
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-lg font-semibold">
                  {formatFiat(last, currency)}
                </span>
                {changePct !== undefined && (
                  <span
                    className={`font-mono text-xs ${changePct >= 0 ? 'text-success' : 'text-destructive'}`}
                  >
                    {formatChange(changePct)}
                  </span>
                )}
              </div>
            )}
          </div>

          <ChartBody
            needsStockKey={needsStockKey}
            isLoading={activeQuery.isLoading}
            points={points}
            currency={currency}
            rangeDays={rangeDays}
          />
        </Card>
      </main>
    </>
  );
}
