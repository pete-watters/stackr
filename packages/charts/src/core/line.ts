import type { DataPoint } from './types.js';
import { moveTo, lineTo, cubicBezier } from './paths.js';

/**
 * Generate a linear line path from data points.
 */
export function linearLine(
  points: DataPoint[],
  scaleX: (v: number) => number,
  scaleY: (v: number) => number,
): string {
  if (points.length === 0) return '';
  const parts = [moveTo(scaleX(points[0].x), scaleY(points[0].y))];
  for (let i = 1; i < points.length; i++) {
    parts.push(lineTo(scaleX(points[i].x), scaleY(points[i].y)));
  }
  return parts.join('');
}

/**
 * Fritsch-Carlson monotone cubic Hermite interpolation.
 * Produces smooth curves that don't overshoot — important for financial data.
 * Inspired by Kraken's smooth line charts.
 */
export function monotoneLine(
  points: DataPoint[],
  scaleX: (v: number) => number,
  scaleY: (v: number) => number,
): string {
  if (points.length === 0) return '';
  if (points.length === 1) return moveTo(scaleX(points[0].x), scaleY(points[0].y));
  if (points.length === 2) return linearLine(points, scaleX, scaleY);

  const n = points.length;
  const xs = points.map(p => scaleX(p.x));
  const ys = points.map(p => scaleY(p.y));

  // Compute slopes
  const deltas: number[] = [];
  const slopes: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i];
    const dy = ys[i + 1] - ys[i];
    deltas.push(dx === 0 ? 0 : dy / dx);
  }

  slopes.push(deltas[0]);
  for (let i = 1; i < n - 1; i++) {
    if (deltas[i - 1] * deltas[i] <= 0) {
      slopes.push(0);
    } else {
      slopes.push((deltas[i - 1] + deltas[i]) / 2);
    }
  }
  slopes.push(deltas[n - 2]);

  // Fritsch-Carlson monotonicity constraints
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(deltas[i]) < 1e-12) {
      slopes[i] = 0;
      slopes[i + 1] = 0;
    } else {
      const alpha = slopes[i] / deltas[i];
      const beta = slopes[i + 1] / deltas[i];
      const tau = alpha * alpha + beta * beta;
      if (tau > 9) {
        const s = 3 / Math.sqrt(tau);
        slopes[i] = s * alpha * deltas[i];
        slopes[i + 1] = s * beta * deltas[i];
      }
    }
  }

  // Build path
  const parts = [moveTo(xs[0], ys[0])];
  for (let i = 0; i < n - 1; i++) {
    const dx = (xs[i + 1] - xs[i]) / 3;
    parts.push(
      cubicBezier(
        xs[i] + dx,
        ys[i] + slopes[i] * dx,
        xs[i + 1] - dx,
        ys[i + 1] - slopes[i + 1] * dx,
        xs[i + 1],
        ys[i + 1],
      ),
    );
  }

  return parts.join('');
}

/**
 * Generate a line path, choosing interpolation method.
 */
export function generateLinePath(
  points: DataPoint[],
  scaleX: (v: number) => number,
  scaleY: (v: number) => number,
  interpolation: 'linear' | 'monotone' = 'linear',
): string {
  return interpolation === 'monotone'
    ? monotoneLine(points, scaleX, scaleY)
    : linearLine(points, scaleX, scaleY);
}
