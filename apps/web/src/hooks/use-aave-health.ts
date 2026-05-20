'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAaveHealth } from '@/lib/defi/aave';

/**
 * Aave v3 liquidation health for an address. Read on demand + cached — no
 * background polling (free-tier friendly, see issue #46). The on-chain call
 * already reflects live oracle prices, so a 60s refresh is plenty.
 */
export function useAaveHealth(address: string, enabled = true) {
  return useQuery({
    queryKey: ['defi', 'aave-health', address],
    queryFn: () => fetchAaveHealth(address),
    enabled: enabled && !!address,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
