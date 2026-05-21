import { describe, it, expect } from 'vitest';
import { chartColors, resolveCssChartColors } from './color.js';

describe('resolveCssChartColors', () => {
  it('returns static defaults when element is null', () => {
    const resolved = resolveCssChartColors(null);
    expect(resolved.bid).toBe(chartColors.bid);
    expect(resolved.ask).toBe(chartColors.ask);
    expect(resolved.line).toBe(chartColors.line);
    expect(resolved.grid).toBe(chartColors.grid);
    expect(resolved.crosshair).toBe(chartColors.crosshair);
    expect(resolved.text).toBe(chartColors.text);
    expect(resolved.tooltipBg).toBe(chartColors.tooltipBg);
  });

  it('returns static defaults when element is undefined', () => {
    const resolved = resolveCssChartColors(undefined);
    expect(resolved.bid).toBe(chartColors.bid);
    expect(resolved.line).toBe(chartColors.line);
  });

  it('resolved object has all required colour keys', () => {
    const resolved = resolveCssChartColors(null);
    const keys: Array<keyof typeof chartColors> = [
      'bid',
      'ask',
      'bidFill',
      'askFill',
      'line',
      'areaFill',
      'grid',
      'crosshair',
      'text',
      'tooltipBg',
    ];
    for (const key of keys) {
      expect(resolved).toHaveProperty(key);
      expect(typeof resolved[key]).toBe('string');
    }
  });

  it('returns a new object (does not mutate chartColors)', () => {
    const resolved = resolveCssChartColors(null);
    expect(resolved).not.toBe(chartColors);
  });
});
