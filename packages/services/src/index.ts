import type { Balance, Chain } from '@stackr/models';
import { fetchBtcBalance } from './btc.js';
import { fetchStxBalance } from './stx.js';
import { fetchEthBalance } from './eth.js';
import { fetchSolBalance } from './sol.js';

export { fetchBtcBalance } from './btc.js';
export { fetchStxBalance } from './stx.js';
export { fetchEthBalance } from './eth.js';
export { fetchSolBalance } from './sol.js';
export { fetchPrices, fetchPriceHistory } from './prices.js';
export { formatFiat, formatUsd, formatCrypto, formatChange } from './format.js';
export {
  serializeOrderBook,
  generateMockOrderBook,
  createKrakenOrderBookWs,
  type KrakenWebSocketMessage,
} from './orderbook.js';
export { fetchTransactions } from './transactions.js';
export { getExplorerUrl } from './explorers.js';

export interface FetchBalanceOptions {
  ethApiKey?: string;
}

export async function fetchBalance(
  chain: Chain,
  address: string,
  options?: FetchBalanceOptions,
): Promise<Balance> {
  switch (chain) {
    case 'btc':
      return fetchBtcBalance(address);
    case 'stx':
      return fetchStxBalance(address);
    case 'eth':
      return fetchEthBalance(address, options?.ethApiKey);
    case 'sol':
      return fetchSolBalance(address);
  }
}
