import type { DataPoint } from './types.js';
import { generateLinePath } from './line.js';
import { lineTo, verticalTo, horizontalTo, closePath } from './paths.js';

/**
 * Generate an area path (closed shape below the line).
 * The area extends from the line down to baseline (typically the chart bottom).
 */
export function generateAreaPath(
  points: DataPoint[],
  scaleX: (v: number) => number,
  scaleY: (v: number) => number,
  baseline: number,
  interpolation: 'linear' | 'monotone' = 'linear',
): string {
  if (points.length === 0) return '';

  const linePath = generateLinePath(points, scaleX, scaleY, interpolation);

  // Close the path: go to bottom-right, then bottom-left, then close
  const lastX = scaleX(points[points.length - 1].x);
  const firstX = scaleX(points[0].x);

  return linePath + verticalTo(baseline) + horizontalTo(firstX) + closePath();
}
