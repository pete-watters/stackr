import type { Balance, Chain } from '@stackr/models';
import { btcBalanceAdapter } from './btc.js';
import { stxBalanceAdapter } from './stx.js';
import { ethBalanceAdapter } from './eth.js';
import { solBalanceAdapter } from './sol.js';
import type { BalanceAdapter } from './ports.js';

// Provider ports (the contracts the app depends on) and the concrete adapters.
export type {
  BalanceAdapter,
  BalanceAdapterOptions,
  PriceAdapter,
  TransactionAdapter,
  StockAdapter,
  OrderBookAdapter,
} from './ports.js';

export { fetchBtcBalance, btcBalanceAdapter } from './btc.js';
export { fetchStxBalance, lookupStacksBnsName, stxBalanceAdapter } from './stx.js';
export { fetchEthBalance, ethBalanceAdapter } from './eth.js';
export { fetchSolBalance, solBalanceAdapter } from './sol.js';
export {
  fetchPrices,
  fetchPriceHistory,
  normalizeCoinGeckoPrices,
  normalizeMarketChart,
  coinGeckoPriceAdapter,
} from './prices.js';
export { parseOrThrow } from './validate.js';
export { formatBaseUnits } from './base-units.js';
export { formatFiat, formatUsd, formatCrypto, formatChange } from './format.js';
export {
  serializeOrderBook,
  generateMockOrderBook,
  createKrakenOrderBookWs,
  createBookState,
  applyBookFrame,
  bookStateToLadders,
  orderBookAdapter,
  type KrakenWebSocketMessage,
  type KrakenBookLevel,
  type BookState,
} from './orderbook.js';
export {
  parseTickerFrame,
  createKrakenTickerWs,
  type Tick,
  type KrakenTickerMessage,
} from './ticker.js';
export {
  fetchTransactions,
  transactionAdapter,
  normalizeBtcTransactions,
  normalizeEthTransactions,
  normalizeStxTransactions,
  normalizeSolTransactions,
} from './transactions.js';
export { getExplorerUrl } from './explorers.js';
export {
  searchStocks,
  fetchStockQuote,
  fetchStockQuotes,
  fetchStockPriceHistory,
  parseDailyCloses,
  alphaVantageStockAdapter,
  type StockSearchResult,
  type StockQuote,
} from './stocks.js';

export interface FetchBalanceOptions {
  ethApiKey?: string;
}

/**
 * Registry of per-chain balance adapters, keyed by chain. Replaces the old
 * hand-written `switch` with a single lookup; `satisfies` guarantees at
 * compile time that every `Chain` has exactly one adapter, so adding a chain
 * is a type error until its adapter is registered here.
 */
const balanceAdapters = {
  btc: btcBalanceAdapter,
  stx: stxBalanceAdapter,
  eth: ethBalanceAdapter,
  sol: solBalanceAdapter,
} satisfies Record<Chain, BalanceAdapter>;

export async function fetchBalance(
  chain: Chain,
  address: string,
  options?: FetchBalanceOptions,
): Promise<Balance> {
  // `ethApiKey` is the public, app-facing name kept for back-compat with the
  // query hooks and pages; it maps onto the adapter port's generic `apiKey`.
  return balanceAdapters[chain].fetchBalance(address, { apiKey: options?.ethApiKey });
}
