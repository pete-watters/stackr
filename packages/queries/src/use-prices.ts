import { useQuery } from '@tanstack/react-query';
import type { Chain } from '@stackr/models';
import { fetchPrices } from '@stackr/services';
import { queryKeys } from './keys.js';

export function usePrices(chains: Chain[]) {
  return useQuery({
    queryKey: queryKeys.pricesByChains(chains),
    queryFn: () => fetchPrices(chains),
    enabled: chains.length > 0,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
