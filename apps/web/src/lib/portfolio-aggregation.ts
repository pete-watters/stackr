import type { Chain, Price } from '@stackr/models';

/**
 * A priced crypto position. Wallet balances and manual holdings both reduce to
 * this shape so they aggregate identically downstream.
 */
export interface CryptoPosition {
  chain: Chain;
  quantity: number;
}

export interface ChainValue {
  chain: Chain;
  fiatValue: number;
}

export interface CryptoAggregate {
  /** Combined fiat value of every position with a known price. */
  cryptoTotal: number;
  /** Per-chain fiat value, only chains with a positive value, value-descending. */
  perChain: ChainValue[];
  /** Value-weighted 24h change across priced positions, or undefined if none. */
  weightedChange?: number;
}

/**
 * Aggregate crypto positions into a fiat total, per-chain breakdown, and a
 * value-weighted 24h change. Positions without a matching price are ignored so
 * a missing price feed never inflates or zeroes the total spuriously.
 */
export function aggregateCryptoPositions(
  positions: CryptoPosition[],
  prices: Price[],
): CryptoAggregate {
  const priceMap = new Map(prices.map(p => [p.chain, p]));

  const byChain = new Map<Chain, number>();
  let cryptoTotal = 0;
  let changeNumerator = 0;

  for (const { chain, quantity } of positions) {
    const price = priceMap.get(chain);
    if (!price) continue;
    const value = quantity * price.fiatPrice;
    cryptoTotal += value;
    changeNumerator += price.change24h * value;
    byChain.set(chain, (byChain.get(chain) ?? 0) + value);
  }

  const perChain = [...byChain.entries()]
    .map(([chain, fiatValue]) => ({ chain, fiatValue }))
    .filter(c => c.fiatValue > 0)
    .sort((a, b) => b.fiatValue - a.fiatValue);

  return {
    cryptoTotal,
    perChain,
    weightedChange: cryptoTotal > 0 ? changeNumerator / cryptoTotal : undefined,
  };
}
