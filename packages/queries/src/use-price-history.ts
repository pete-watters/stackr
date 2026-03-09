import { useQuery } from '@tanstack/react-query';
import type { Chain } from '@stackr/models';
import { fetchPriceHistory } from '@stackr/services';
import { queryKeys } from './keys.js';

export function usePriceHistory(chain: Chain, days: number = 7) {
  return useQuery({
    queryKey: queryKeys.priceHistory(chain, days),
    queryFn: () => fetchPriceHistory(chain, days),
    staleTime: 60_000,
    refetchInterval: 300_000,
  });
}
