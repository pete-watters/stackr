import type { PriceHistoryPoint } from '@stackr/models';

const AV_BASE = 'https://www.alphavantage.co/query';

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export async function searchStocks(query: string, apiKey: string): Promise<StockSearchResult[]> {
  const url = `${AV_BASE}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Alpha Vantage API error: ${res.status}`);
  }

  const data = await res.json();
  const matches = data.bestMatches ?? [];

  return matches.map(
    (m: Record<string, string>): StockSearchResult => ({
      symbol: m['1. symbol'] ?? '',
      name: m['2. name'] ?? '',
      type: m['3. type'] ?? '',
      region: m['4. region'] ?? '',
      currency: m['8. currency'] ?? 'USD',
    }),
  );
}

export async function fetchStockQuote(symbol: string, apiKey: string): Promise<StockQuote> {
  const url = `${AV_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Alpha Vantage API error: ${res.status}`);
  }

  const data = await res.json();
  const quote = data['Global Quote'] ?? {};

  return {
    symbol: quote['01. symbol'] ?? symbol,
    price: parseFloat(quote['05. price'] ?? '0'),
    change: parseFloat(quote['09. change'] ?? '0'),
    changePercent: parseFloat((quote['10. change percent'] ?? '0').replace('%', '')),
  };
}

export async function fetchStockQuotes(symbols: string[], apiKey: string): Promise<StockQuote[]> {
  const results = await Promise.allSettled(symbols.map(s => fetchStockQuote(s, apiKey)));

  return results
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled')
    .map(r => r.value);
}

/** One day of the Alpha Vantage TIME_SERIES_DAILY payload: `{ "4. close": "1.23", ... }`. */
type AlphaVantageDailySeries = Record<string, Record<string, string>>;

/**
 * Turn an Alpha Vantage daily series into ascending close-price points, keeping
 * only the most recent `days`. Pure (no network) so it is unit-testable.
 */
export function parseDailyCloses(
  series: AlphaVantageDailySeries | undefined,
  days: number,
): PriceHistoryPoint[] {
  if (!series) return [];

  const points = Object.entries(series)
    .map(([date, ohlc]) => ({
      timestamp: new Date(date).getTime(),
      price: parseFloat(ohlc['4. close'] ?? '0'),
    }))
    .filter(point => Number.isFinite(point.timestamp) && point.price > 0)
    .sort((a, b) => a.timestamp - b.timestamp);

  return points.slice(Math.max(0, points.length - days));
}

/**
 * Daily close-price history for a stock symbol (Alpha Vantage free tier is
 * daily-only). `days` selects how many recent points to keep — `compact`
 * (~100 days) covers up to ~3 months, `full` is needed beyond that.
 */
export async function fetchStockPriceHistory(
  symbol: string,
  apiKey: string,
  days: number,
): Promise<PriceHistoryPoint[]> {
  const outputsize = days > 100 ? 'full' : 'compact';
  const url = `${AV_BASE}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=${outputsize}&apikey=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Alpha Vantage API error: ${res.status}`);
  }

  const data = await res.json();
  const series = data['Time Series (Daily)'];

  if (!series) {
    // Rate-limit / error responses carry one of these instead of a series.
    const reason = data['Note'] ?? data['Information'] ?? data['Error Message'] ?? 'no daily data';
    throw new Error(`Alpha Vantage: ${reason}`);
  }

  return parseDailyCloses(series, days);
}
