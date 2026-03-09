import { describe, it, expect } from 'vitest';
import { createLinearScale, computeDomain, niceTicks, niceNumber } from './scales.js';

describe('createLinearScale', () => {
  it('maps domain to range linearly', () => {
    const scale = createLinearScale({ domain: [0, 100], range: [0, 200] });
    expect(scale(0)).toBe(0);
    expect(scale(50)).toBe(100);
    expect(scale(100)).toBe(200);
  });

  it('handles inverted range (for Y axis)', () => {
    const scale = createLinearScale({ domain: [0, 100], range: [200, 0] });
    expect(scale(0)).toBe(200);
    expect(scale(100)).toBe(0);
    expect(scale(50)).toBe(100);
  });

  it('handles zero-span domain', () => {
    const scale = createLinearScale({ domain: [5, 5], range: [0, 100] });
    expect(scale(5)).toBe(0);
  });
});

describe('computeDomain', () => {
  it('returns min/max of values', () => {
    expect(computeDomain([3, 1, 4, 1, 5])).toEqual([1, 5]);
  });

  it('applies padding', () => {
    const [min, max] = computeDomain([0, 100], 0.1);
    expect(min).toBe(-10);
    expect(max).toBe(110);
  });

  it('returns [0, 1] for empty array', () => {
    expect(computeDomain([])).toEqual([0, 1]);
  });
});

describe('niceTicks', () => {
  it('generates tick values', () => {
    const ticks = niceTicks(0, 100, 5);
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks[0]).toBeLessThanOrEqual(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(100);
  });

  it('handles small ranges', () => {
    const ticks = niceTicks(0.1, 0.5, 5);
    expect(ticks.length).toBeGreaterThan(0);
  });
});

describe('niceNumber', () => {
  it('rounds to nice values', () => {
    expect(niceNumber(11, true)).toBe(10);
    expect(niceNumber(35, true)).toBe(50);
    expect(niceNumber(75, true)).toBe(100);
  });
});
