import type { Chain, Currency } from '@stackr/models';

export const queryKeys = {
  all: ['stackr'] as const,
  balances: () => [...queryKeys.all, 'balance'] as const,
  balance: (chain: Chain, address: string) => [...queryKeys.balances(), chain, address] as const,
  prices: () => [...queryKeys.all, 'prices'] as const,
  pricesByChains: (chains: Chain[], currency: Currency = 'usd') =>
    [...queryKeys.prices(), currency, ...chains] as const,
  priceHistory: (chain: Chain, days: number, currency: Currency = 'usd') =>
    [...queryKeys.all, 'price-history', chain, days, currency] as const,
  stockSearch: (query: string) => [...queryKeys.all, 'stock-search', query] as const,
  stockQuotes: (symbols: string[]) => [...queryKeys.all, 'stock-quotes', ...symbols] as const,
};
