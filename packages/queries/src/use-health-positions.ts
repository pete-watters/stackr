import { useQueries, useQueryClient } from '@tanstack/react-query';
import type { HealthPosition } from '@stackr/models';
import { healthAdapters } from '@stackr/services';
import { queryKeys } from './keys.js';

/**
 * Liquidation-health is refreshed **on demand**, never background-polled: the
 * per-account reads are the expensive ones, and a generous stale time plus an
 * explicit refresh action (and refetch-on-focus) is the free-tier-honest model
 * from ADR 0016. So: long `staleTime`, no `refetchInterval`.
 */
const HEALTH_STALE_TIME = 5 * 60 * 1000;

export interface UseHealthPositionsResult {
  /** Merged, non-empty positions across every adapter × address, riskiest first. */
  positions: HealthPosition[];
  /** True while any position is loading for the first time. */
  isLoading: boolean;
  /** True while any position is (re)fetching, e.g. after a manual refresh. */
  isFetching: boolean;
  /** True if any adapter read failed. */
  isError: boolean;
  /** Explicit on-demand refresh — invalidates every health query. */
  refresh: () => void;
}

/**
 * Collapse the per-query results into the list the UI renders: drop the misses
 * (an adapter returns `null` for an address with no position on that protocol,
 * `undefined` while still loading) and sort riskiest-first so the position
 * closest to liquidation leads. Pure, so the merge is unit-testable without
 * standing up React Query.
 */
export function mergeHealthPositions(
  results: Array<HealthPosition | null | undefined>,
): HealthPosition[] {
  return results
    .filter((position): position is HealthPosition => position != null)
    .sort((a, b) => b.liquidationRisk - a.liquidationRisk);
}

/**
 * Fans the health adapters out across the given EVM addresses, one query per
 * adapter × address, and merges the results. Stage 1 ships the Aave v3 adapter
 * (EVM); later stages register Kamino (SOL) and the Stacks protocols.
 */
export function useHealthPositions(addresses: string[]): UseHealthPositionsResult {
  const queryClient = useQueryClient();

  // The addresses handed in are EVM accounts, so only the EVM adapters apply.
  const evmAdapters = healthAdapters.filter(adapter => adapter.chain === 'eth');
  const pairs = evmAdapters.flatMap(adapter => addresses.map(address => ({ adapter, address })));

  const queries = useQueries({
    queries: pairs.map(({ adapter, address }) => ({
      queryKey: queryKeys.healthPosition(adapter.protocol, address),
      queryFn: () => adapter.fetchPosition(address),
      staleTime: HEALTH_STALE_TIME,
      refetchOnWindowFocus: true,
      // Deliberately no refetchInterval — health is never background-polled.
    })),
  });

  return {
    positions: mergeHealthPositions(queries.map(query => query.data)),
    isLoading: queries.some(query => query.isLoading),
    isFetching: queries.some(query => query.isFetching),
    isError: queries.some(query => query.isError),
    refresh: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.health() });
    },
  };
}
