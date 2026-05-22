import { chainMeta } from '@stackr/models';
import type { Chain, PriceHistoryPoint } from '@stackr/models';
import type { DataPoint } from '@stackr/charts';

export type ChartAsset =
  | { kind: 'crypto'; chain: Chain; label: string }
  | { kind: 'stock'; symbol: string; label: string };

export interface ChartRange {
  label: string;
  days: number;
}

export const CHART_RANGES: ChartRange[] = [
  { label: '24H', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '1Y', days: 365 },
];

// When the user tracks nothing yet, the page still demos with the core chains.
const DEFAULT_CHAINS: Chain[] = ['btc', 'eth', 'sol', 'stx'];

/**
 * The assets a user can chart: the distinct chains they watch/connect (or the
 * default four), followed by any stock symbols they hold.
 */
export function buildAssetOptions(input: {
  walletChains: Chain[];
  connectedChains: Chain[];
  stockSymbols: string[];
}): ChartAsset[] {
  const chainSet = new Set<Chain>([...input.walletChains, ...input.connectedChains]);
  const chains = chainSet.size > 0 ? [...chainSet] : DEFAULT_CHAINS;

  const crypto: ChartAsset[] = chains.map(chain => ({
    kind: 'crypto',
    chain,
    label: `${chainMeta[chain].name} (${chainMeta[chain].symbol})`,
  }));

  const seen = new Set<string>();
  const stocks: ChartAsset[] = [];
  for (const symbol of input.stockSymbols) {
    if (symbol.length > 0 && !seen.has(symbol)) {
      seen.add(symbol);
      stocks.push({ kind: 'stock', symbol, label: symbol });
    }
  }

  return [...crypto, ...stocks];
}

export function assetId(asset: ChartAsset): string {
  return asset.kind === 'crypto' ? `crypto:${asset.chain}` : `stock:${asset.symbol}`;
}

export function findAsset(options: ChartAsset[], id: string): ChartAsset | undefined {
  return options.find(option => assetId(option) === id);
}

/** Alpha Vantage's free tier is daily-only, so intraday (24H) isn't available for stocks. */
export function isRangeAllowed(asset: ChartAsset, range: ChartRange): boolean {
  if (asset.kind === 'stock' && range.days < 7) return false;
  return true;
}

export function toDataPoints(history: PriceHistoryPoint[]): DataPoint[] {
  return history.map(point => ({ x: point.timestamp, y: point.price }));
}

/** Axis/tooltip time label, granularity chosen to suit the selected range. */
export function formatAxisTime(ms: number, days: number): string {
  const date = new Date(ms);
  if (days <= 1) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  if (days <= 30) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}
