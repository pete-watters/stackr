import type { Chain } from '@stackr/models';

export const queryKeys = {
  all: ['stackr'] as const,
  balances: () => [...queryKeys.all, 'balance'] as const,
  balance: (chain: Chain, address: string) => [...queryKeys.balances(), chain, address] as const,
  prices: () => [...queryKeys.all, 'prices'] as const,
  pricesByChains: (chains: Chain[]) => [...queryKeys.prices(), ...chains] as const,
  priceHistory: (chain: Chain, days: number) =>
    [...queryKeys.all, 'price-history', chain, days] as const,
};
