import { useQuery } from '@tanstack/react-query';
import type { Chain } from '@stackr/models';
import { fetchTransactions } from '@stackr/services';
import { queryKeys } from './keys.js';

export function useTransactions(chain: Chain, address: string) {
  return useQuery({
    queryKey: [...queryKeys.all, 'transactions', chain, address] as const,
    queryFn: () => fetchTransactions(chain, address),
    enabled: !!address,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
