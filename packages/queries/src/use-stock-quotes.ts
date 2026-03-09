import { useQuery } from '@tanstack/react-query';
import { fetchStockQuotes } from '@stackr/services';
import { queryKeys } from './keys.js';

export function useStockQuotes(symbols: string[], apiKey: string) {
  return useQuery({
    queryKey: queryKeys.stockQuotes(symbols),
    queryFn: () => fetchStockQuotes(symbols, apiKey),
    enabled: symbols.length > 0 && apiKey.length > 0,
    staleTime: 5 * 60_000,
    refetchInterval: 15 * 60_000,
  });
}
