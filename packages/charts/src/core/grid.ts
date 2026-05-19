import type { TickData } from './axis.js';

export interface GridLineData {
  position: number;
  isHorizontal: boolean;
}

/**
 * Generate grid line positions from tick data.
 */
export function computeGridLines(ticks: TickData[], isHorizontal: boolean): GridLineData[] {
  return ticks.map(tick => ({
    position: tick.position,
    isHorizontal,
  }));
}
