import { describe, it, expect } from 'vitest';
import { generateSparklinePath } from './sparkline.js';

describe('generateSparklinePath', () => {
  it('returns empty string for < 2 values', () => {
    expect(generateSparklinePath([], 100, 32)).toBe('');
    expect(generateSparklinePath([5], 100, 32)).toBe('');
  });

  it('generates a valid SVG path for data', () => {
    const path = generateSparklinePath([10, 20, 15, 25, 30], 100, 32);
    expect(path).toMatch(/^M/);
    expect(path.length).toBeGreaterThan(0);
  });

  it('starts with M command', () => {
    const path = generateSparklinePath([1, 2, 3], 80, 24);
    expect(path.startsWith('M')).toBe(true);
  });
});
