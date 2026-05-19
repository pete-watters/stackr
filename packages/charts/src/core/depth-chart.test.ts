import { describe, it, expect } from 'vitest';
import { generateBidPath, generateAskPath, generateDepthLinePath } from './depth-chart.js';
import type { DepthOrder } from './types.js';

const identity = (v: number) => v;

const sampleBids: DepthOrder[] = [
  { price: 100, amount: 5, cumulativeAmount: 5 },
  { price: 99, amount: 3, cumulativeAmount: 8 },
  { price: 98, amount: 2, cumulativeAmount: 10 },
];

const sampleAsks: DepthOrder[] = [
  { price: 101, amount: 4, cumulativeAmount: 4 },
  { price: 102, amount: 6, cumulativeAmount: 10 },
  { price: 103, amount: 2, cumulativeAmount: 12 },
];

describe('generateBidPath', () => {
  it('returns empty for no bids', () => {
    expect(generateBidPath([], identity, identity, 100)).toBe('');
  });

  it('generates a closed path with step functions', () => {
    const path = generateBidPath(sampleBids, identity, identity, 100);
    expect(path).toContain('M');
    expect(path).toContain('Z');
    expect(path).toContain('V');
    expect(path).toContain('H');
  });
});

describe('generateAskPath', () => {
  it('returns empty for no asks', () => {
    expect(generateAskPath([], identity, identity, 100)).toBe('');
  });

  it('generates a closed path with step functions', () => {
    const path = generateAskPath(sampleAsks, identity, identity, 100);
    expect(path).toContain('M');
    expect(path).toContain('Z');
  });
});

describe('generateDepthLinePath', () => {
  it('generates step line for orders', () => {
    const path = generateDepthLinePath(sampleBids, identity, identity, false);
    expect(path).toMatch(/^M/);
    expect(path).toContain('H');
    expect(path).toContain('V');
  });
});
