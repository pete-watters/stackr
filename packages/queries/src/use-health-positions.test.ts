import { describe, expect, it } from 'vitest';
import type { HealthPosition } from '@stackr/models';
import { mergeHealthPositions } from './use-health-positions.js';

function position(
  overrides: Partial<HealthPosition> & { liquidationRisk: number },
): HealthPosition {
  return {
    chain: 'eth',
    protocol: 'aave-v3',
    address: '0xabc',
    collateralValueUsd: 1_000,
    debtValueUsd: 500,
    native: {},
    oracle: 'aave-oracle',
    updatedAt: '2026-06-11T00:00:00.000Z',
    ...overrides,
  };
}

describe('mergeHealthPositions', () => {
  it('drops nulls (no position) and undefined (still loading)', () => {
    const merged = mergeHealthPositions([
      position({ liquidationRisk: 0.4 }),
      null,
      undefined,
      position({ liquidationRisk: 0.7 }),
    ]);
    expect(merged).toHaveLength(2);
  });

  it('sorts riskiest-first', () => {
    const merged = mergeHealthPositions([
      position({ address: '0x1', liquidationRisk: 0.2 }),
      position({ address: '0x2', liquidationRisk: 0.9 }),
      position({ address: '0x3', liquidationRisk: 0.5 }),
    ]);
    expect(merged.map(p => p.liquidationRisk)).toEqual([0.9, 0.5, 0.2]);
  });

  it('returns an empty array when everything is a miss', () => {
    expect(mergeHealthPositions([null, undefined])).toEqual([]);
  });
});
