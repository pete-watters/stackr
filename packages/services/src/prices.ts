import { z } from 'zod';
import type { Chain, Currency, Price, PriceHistoryPoint } from '@stackr/models';
import { PriceHistoryPointSchema, PriceSchema } from '@stackr/models';
import type { PriceAdapter } from './ports.js';
import { parseOrThrow } from './validate.js';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

const chainToCoinGeckoId: Record<Chain, string> = {
  btc: 'bitcoin',
  eth: 'ethereum',
  stx: 'blockstack',
  sol: 'solana',
};

/**
 * Ingress schema for CoinGecko `simple/price`: a map of coin id → a bag of
 * `{ <currency>: number, <currency>_24h_change: number }` pairs. The currency
 * keys are dynamic (they depend on `vs_currencies`), so each entry is modeled
 * as a record of numbers rather than fixed fields.
 */
const CoinGeckoSimplePriceSchema = z.record(z.string(), z.record(z.string(), z.number()));

type CoinGeckoSimplePrice = z.infer<typeof CoinGeckoSimplePriceSchema>;

/**
 * Pure normalization from CoinGecko's id-keyed map to our per-chain `Price[]`.
 * Extracted from the network call so it is unit-testable, and so the mapping
 * of vendor keys → domain fields lives in one inspectable place. Missing
 * entries degrade to zeros (CoinGecko silently omits ids it doesn't know),
 * which is preferable to throwing for one unsupported chain in a batch.
 */
export function normalizeCoinGeckoPrices(
  data: CoinGeckoSimplePrice,
  chains: Chain[],
  currency: Currency,
  now: string,
): Price[] {
  const prices = chains.map(chain => {
    const entry = data[chainToCoinGeckoId[chain]];

    return {
      chain,
      usdPrice: entry?.usd ?? 0,
      fiatPrice: entry?.[currency] ?? entry?.usd ?? 0,
      currency,
      change24h: entry?.usd_24h_change ?? 0,
      updatedAt: now,
    };
  });

  return parseOrThrow(z.array(PriceSchema), prices, 'prices.fetchPrices(egress)');
}

export async function fetchPrices(chains: Chain[], currency: Currency = 'usd'): Promise<Price[]> {
  const ids = chains.map(c => chainToCoinGeckoId[c]).join(',');
  const url = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=${currency},usd&include_24hr_change=true`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`CoinGecko API error: ${res.status}`);
  }

  const data = parseOrThrow(
    CoinGeckoSimplePriceSchema,
    await res.json(),
    'prices.fetchPrices(ingress)',
  );

  return normalizeCoinGeckoPrices(data, chains, currency, new Date().toISOString());
}

/**
 * Ingress schema for CoinGecko `market_chart`: `prices` is an array of
 * `[timestampMs, price]` tuples (the endpoint also returns market caps and
 * volumes, which we don't consume).
 */
const CoinGeckoMarketChartSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
});

type CoinGeckoMarketChart = z.infer<typeof CoinGeckoMarketChartSchema>;

/** Pure normalization from CoinGecko `market_chart` to `PriceHistoryPoint[]`. */
export function normalizeMarketChart(data: CoinGeckoMarketChart): PriceHistoryPoint[] {
  const points = data.prices.map(([timestamp, price]) => ({ timestamp, price }));

  return parseOrThrow(z.array(PriceHistoryPointSchema), points, 'prices.fetchPriceHistory(egress)');
}

export async function fetchPriceHistory(
  chain: Chain,
  days: number = 7,
  currency: Currency = 'usd',
): Promise<PriceHistoryPoint[]> {
  const id = chainToCoinGeckoId[chain];
  const url = `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=${currency}&days=${days}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`CoinGecko API error: ${res.status}`);
  }

  const data = parseOrThrow(
    CoinGeckoMarketChartSchema,
    await res.json(),
    'prices.fetchPriceHistory(ingress)',
  );

  return normalizeMarketChart(data);
}

/** CoinGecko-backed implementation of the price port. */
export const coinGeckoPriceAdapter: PriceAdapter = {
  fetchPrices,
  fetchPriceHistory,
};
