import { useQuery } from '@tanstack/react-query';
import type { Chain, Currency } from '@stackr/models';
import { fetchPrices } from '@stackr/services';
import { queryKeys } from './keys.js';

export function usePrices(chains: Chain[], currency: Currency = 'usd') {
  return useQuery({
    queryKey: queryKeys.pricesByChains(chains, currency),
    queryFn: () => fetchPrices(chains, currency),
    enabled: chains.length > 0,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
