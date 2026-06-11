import type {
  Balance,
  Chain,
  Currency,
  OrderBook,
  Price,
  PriceHistoryPoint,
  StockQuote,
  StockSearchResult,
  Transaction,
} from '@stackr/models';

/**
 * Provider "ports" — the explicit contracts the app depends on.
 *
 * These interfaces are the inward-facing boundary of the anti-corruption
 * layer. The app (queries, pages) is written against THESE shapes, never
 * against a vendor's API. Each concrete adapter (btc.ts, eth.ts, prices.ts,
 * …) is the outward-facing half: it talks to one specific vendor, maps that
 * vendor's payload onto the domain types from `@stackr/models`, and validates
 * the result before returning. Swapping a vendor (Blockstream → mempool.space,
 * Etherscan → Alchemy) is then a change to a single adapter, with the port —
 * and therefore every call site — untouched.
 *
 * The interfaces deliberately speak only in `@stackr/models` domain types.
 * No vendor response interface appears here; that is the whole point.
 */

/**
 * Per-call options threaded into a balance adapter.
 *
 * Only the ETH adapter currently consumes `apiKey` (a user-supplied Etherscan
 * key); the other chains ignore it. Modeling it as an optional field on a
 * shared options object keeps the port uniform across chains while letting the
 * dashboard pass one object to all of them.
 */
export interface BalanceAdapterOptions {
  /** User-supplied API key for the underlying vendor (ETH → Etherscan). */
  apiKey?: string;
}

/** A single-chain balance source (one adapter per chain). */
export interface BalanceAdapter {
  /** The chain this adapter serves; used to build the dispatch registry. */
  readonly chain: Chain;
  fetchBalance(address: string, options?: BalanceAdapterOptions): Promise<Balance>;
}

/** Spot prices and historical price series for the supported chains. */
export interface PriceAdapter {
  fetchPrices(chains: Chain[], currency?: Currency): Promise<Price[]>;
  fetchPriceHistory(chain: Chain, days?: number, currency?: Currency): Promise<PriceHistoryPoint[]>;
}

/** Recent on-chain transaction history for an address. */
export interface TransactionAdapter {
  fetchTransactions(chain: Chain, address: string): Promise<Transaction[]>;
}

/** Equities data (symbol search, quotes, daily history). */
export interface StockAdapter {
  search(query: string, apiKey: string): Promise<StockSearchResult[]>;
  fetchQuote(symbol: string, apiKey: string): Promise<StockQuote>;
  fetchQuotes(symbols: string[], apiKey: string): Promise<StockQuote[]>;
  fetchPriceHistory(symbol: string, apiKey: string, days: number): Promise<PriceHistoryPoint[]>;
}

/**
 * Normalizes raw `[price, amount]` ladders (REST snapshot or live Kraken WS
 * frames) into a sorted, cumulative `OrderBook`. Pure transform — no network —
 * but it still sits behind a port so the validated `OrderBook` shape is the
 * only thing the charts layer ever sees.
 */
export interface OrderBookAdapter {
  serialize(
    rawBids: Array<[number, number]>,
    rawAsks: Array<[number, number]>,
    pair: string,
  ): OrderBook;
}
