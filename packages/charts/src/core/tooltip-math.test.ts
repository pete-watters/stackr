import { describe, it, expect } from 'vitest';
import { bisectNearest } from './tooltip-math.js';
import type { DataPoint } from './types.js';

const identity = (v: number) => v;

describe('bisectNearest', () => {
  const points: DataPoint[] = [
    { x: 0, y: 10 },
    { x: 10, y: 20 },
    { x: 20, y: 15 },
    { x: 30, y: 25 },
    { x: 40, y: 30 },
  ];

  it('returns null for empty points', () => {
    expect(bisectNearest([], 5, identity)).toBeNull();
  });

  it('returns the only point for single-element array', () => {
    const result = bisectNearest([{ x: 5, y: 10 }], 100, identity);
    expect(result?.index).toBe(0);
  });

  it('finds exact match', () => {
    const result = bisectNearest(points, 20, identity);
    expect(result?.point.x).toBe(20);
  });

  it('finds nearest point to left', () => {
    const result = bisectNearest(points, 8, identity);
    expect(result?.point.x).toBe(10);
  });

  it('finds nearest point to right', () => {
    const result = bisectNearest(points, 12, identity);
    expect(result?.point.x).toBe(10);
  });

  it('handles value before first point', () => {
    const result = bisectNearest(points, -5, identity);
    expect(result?.index).toBe(0);
  });

  it('handles value after last point', () => {
    const result = bisectNearest(points, 50, identity);
    expect(result?.index).toBe(4);
  });
});
