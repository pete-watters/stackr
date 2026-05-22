import { useQuery } from '@tanstack/react-query';
import type { Chain, Currency } from '@stackr/models';
import { fetchPriceHistory } from '@stackr/services';
import { queryKeys } from './keys.js';

export function usePriceHistory(
  chain: Chain,
  days: number = 7,
  currency: Currency = 'usd',
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.priceHistory(chain, days, currency),
    queryFn: () => fetchPriceHistory(chain, days, currency),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    refetchInterval: 300_000,
  });
}
