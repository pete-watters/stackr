import { useQuery } from '@tanstack/react-query';
import type { Chain } from '@stackr/models';
import { fetchBalance } from '@stackr/services';
import type { FetchBalanceOptions } from '@stackr/services';
import { queryKeys } from './keys.js';

export interface UseBalanceOptions extends FetchBalanceOptions {
  enabled?: boolean;
}

export function useBalance(chain: Chain, address: string, options?: UseBalanceOptions) {
  const { enabled = true, ...fetchOptions } = options ?? {};

  return useQuery({
    queryKey: queryKeys.balance(chain, address),
    queryFn: () => fetchBalance(chain, address, fetchOptions),
    enabled: enabled && !!address,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
