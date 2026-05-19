import type { DataPoint } from './types.js';

/**
 * Find the nearest data point to a given x position using binary search.
 * Used for tooltip/crosshair positioning — like Kraken's hover behavior.
 */
export function bisectNearest(
  points: DataPoint[],
  targetX: number,
  scaleX: (v: number) => number,
): { index: number; point: DataPoint } | null {
  if (points.length === 0) return null;
  if (points.length === 1) return { index: 0, point: points[0] };

  const scaledTarget = targetX;
  let lo = 0;
  let hi = points.length - 1;

  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (scaleX(points[mid].x) < scaledTarget) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  // Compare lo and lo-1 to find nearest
  if (lo > 0) {
    const dLeft = Math.abs(scaleX(points[lo - 1].x) - scaledTarget);
    const dRight = Math.abs(scaleX(points[lo].x) - scaledTarget);
    if (dLeft < dRight) {
      return { index: lo - 1, point: points[lo - 1] };
    }
  }

  return { index: lo, point: points[lo] };
}
