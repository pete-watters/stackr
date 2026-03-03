import type { Chain } from '@stackr/models';

export const queryKeys = {
  all: ['stackr'] as const,
  balances: () => [...queryKeys.all, 'balance'] as const,
  balance: (chain: Chain, address: string) => [...queryKeys.balances(), chain, address] as const,
};
