import { createLinearScale, computeDomain } from './scales.js';
import { monotoneLine } from './line.js';
import type { DataPoint } from './types.js';

/**
 * Generate a sparkline SVG path string from a simple number array.
 * Minimal: number[] → SVG path string.
 */
export function generateSparklinePath(
  values: number[],
  width: number,
  height: number,
  padding: number = 2,
): string {
  if (values.length < 2) return '';

  const points: DataPoint[] = values.map((y, i) => ({ x: i, y }));
  const xDomain: [number, number] = [0, values.length - 1];
  const yDomain = computeDomain(values, 0.05);

  const scaleX = createLinearScale({ domain: xDomain, range: [padding, width - padding] });
  const scaleY = createLinearScale({ domain: yDomain, range: [height - padding, padding] });

  return monotoneLine(points, scaleX, scaleY);
}
