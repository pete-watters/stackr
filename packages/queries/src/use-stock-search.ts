import { useQuery } from '@tanstack/react-query';
import { searchStocks } from '@stackr/services';
import { queryKeys } from './keys.js';

export function useStockSearch(query: string, apiKey: string) {
  return useQuery({
    queryKey: queryKeys.stockSearch(query),
    queryFn: () => searchStocks(query, apiKey),
    enabled: query.length >= 1 && apiKey.length > 0,
    staleTime: 5 * 60_000,
  });
}
