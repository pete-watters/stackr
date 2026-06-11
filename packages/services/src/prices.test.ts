import { describe, expect, it } from 'vitest';
import { normalizeCoinGeckoPrices, normalizeMarketChart } from './prices';

const NOW = '2026-06-10T00:00:00.000Z';

describe('normalizeCoinGeckoPrices', () => {
  it('maps the id-keyed CoinGecko map onto per-chain Price objects', () => {
    const data = {
      bitcoin: { usd: 65000, eur: 60000, usd_24h_change: 1.5 },
      ethereum: { usd: 3500, eur: 3200, usd_24h_change: -2.1 },
    };

    expect(normalizeCoinGeckoPrices(data, ['btc', 'eth'], 'eur', NOW)).toEqual([
      {
        chain: 'btc',
        usdPrice: 65000,
        fiatPrice: 60000,
        currency: 'eur',
        change24h: 1.5,
        updatedAt: NOW,
      },
      {
        chain: 'eth',
        usdPrice: 3500,
        fiatPrice: 3200,
        currency: 'eur',
        change24h: -2.1,
        updatedAt: NOW,
      },
    ]);
  });

  it('falls back to usd when the requested currency is absent on an entry', () => {
    const data = { solana: { usd: 150, usd_24h_change: 0 } };

    const [price] = normalizeCoinGeckoPrices(data, ['sol'], 'gbp', NOW);

    expect(price).toMatchObject({ chain: 'sol', usdPrice: 150, fiatPrice: 150, currency: 'gbp' });
  });

  it('degrades a missing chain to zeros rather than throwing', () => {
    const [price] = normalizeCoinGeckoPrices({}, ['btc'], 'usd', NOW);

    expect(price).toMatchObject({ chain: 'btc', usdPrice: 0, fiatPrice: 0, change24h: 0 });
  });
});

describe('normalizeMarketChart', () => {
  it('flattens [timestamp, price] tuples into PriceHistoryPoint objects', () => {
    const data = { prices: [[1, 10] as [number, number], [2, 20] as [number, number]] };

    expect(normalizeMarketChart(data)).toEqual([
      { timestamp: 1, price: 10 },
      { timestamp: 2, price: 20 },
    ]);
  });
});
