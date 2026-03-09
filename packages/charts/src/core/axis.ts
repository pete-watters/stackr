import { niceTicks } from './scales.js';

export interface TickData {
  value: number;
  position: number;
  label: string;
}

/**
 * Compute tick data for an axis.
 */
export function computeAxisTicks(
  domain: [number, number],
  scale: (v: number) => number,
  tickCount: number = 5,
  formatTick: (value: number) => string = v => v.toLocaleString(),
): TickData[] {
  const ticks = niceTicks(domain[0], domain[1], tickCount);

  return ticks.map(value => ({
    value,
    position: scale(value),
    label: formatTick(value),
  }));
}
