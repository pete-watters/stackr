import type { DepthOrder } from './types.js';
import { moveTo, lineTo, verticalTo, horizontalTo, closePath } from './paths.js';

/**
 * Generate a step-function area path for depth chart bids.
 * Bids go from right to left (highest price to lowest), cumulative amount increasing.
 * Matches Kraken's depth chart style — step functions, not curves.
 */
export function generateBidPath(
  bids: DepthOrder[],
  scaleX: (v: number) => number,
  scaleY: (v: number) => number,
  baseline: number,
): string {
  if (bids.length === 0) return '';

  // Bids sorted by price descending (highest first)
  const sorted = [...bids].sort((a, b) => b.price - a.price);

  const parts = [moveTo(scaleX(sorted[0].price), baseline)];

  for (const order of sorted) {
    const x = scaleX(order.price);
    const y = scaleY(order.cumulativeAmount);
    parts.push(verticalTo(y));
    parts.push(horizontalTo(x));
  }

  // Close back to baseline
  parts.push(verticalTo(baseline));
  parts.push(closePath());

  return parts.join('');
}

/**
 * Generate a step-function area path for depth chart asks.
 * Asks go from left to right (lowest price to highest), cumulative amount increasing.
 */
export function generateAskPath(
  asks: DepthOrder[],
  scaleX: (v: number) => number,
  scaleY: (v: number) => number,
  baseline: number,
): string {
  if (asks.length === 0) return '';

  // Asks sorted by price ascending (lowest first)
  const sorted = [...asks].sort((a, b) => a.price - b.price);

  const parts = [moveTo(scaleX(sorted[0].price), baseline)];

  for (const order of sorted) {
    const x = scaleX(order.price);
    const y = scaleY(order.cumulativeAmount);
    parts.push(verticalTo(y));
    parts.push(horizontalTo(x));
  }

  // Close back to baseline
  parts.push(verticalTo(baseline));
  parts.push(closePath());

  return parts.join('');
}

/**
 * Generate step-function line path (without fill) for the depth outline.
 */
export function generateDepthLinePath(
  orders: DepthOrder[],
  scaleX: (v: number) => number,
  scaleY: (v: number) => number,
  ascending: boolean,
): string {
  if (orders.length === 0) return '';

  const sorted = ascending
    ? [...orders].sort((a, b) => a.price - b.price)
    : [...orders].sort((a, b) => b.price - a.price);

  const parts = [moveTo(scaleX(sorted[0].price), scaleY(sorted[0].cumulativeAmount))];

  for (let i = 1; i < sorted.length; i++) {
    const prevX = scaleX(sorted[i - 1].price);
    const currX = scaleX(sorted[i].price);
    const currY = scaleY(sorted[i].cumulativeAmount);
    // Step: horizontal then vertical
    parts.push(horizontalTo(currX));
    parts.push(verticalTo(currY));
  }

  return parts.join('');
}
