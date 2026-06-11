import type { Chain } from '@stackr/models';

/**
 * The complete, typed set of product-analytics events stackr emits.
 *
 * Event props are deliberately constrained to coarse, non-identifying values
 * (currently just a chain slug like `'btc'`). This is a privacy boundary, not
 * a style preference: NEVER add wallet addresses, balances, fiat amounts,
 * ENS/BNS names, or user-entered API keys here. See the "Privacy" section of
 * the README for the full no-PII contract.
 */
export interface AnalyticsEventMap {
  /** A watch-only or connected wallet was added. */
  wallet_added: { chain: Chain };
  /** A per-chain wallet detail view was opened. */
  chain_viewed: { chain: Chain };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;
