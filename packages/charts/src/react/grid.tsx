import type { TickData } from '../core/axis.js';
import { chartColors } from '../utils/color.js';

export interface GridProps {
  xTicks?: TickData[];
  yTicks?: TickData[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  color?: string;
}

export function Grid({
  xTicks,
  yTicks,
  width,
  height,
  margin,
  color = chartColors.grid,
}: GridProps) {
  return (
    <g>
      {yTicks?.map((tick, i) => (
        <line
          key={`h-${i}`}
          x1={margin.left}
          x2={width - margin.right}
          y1={tick.position}
          y2={tick.position}
          stroke={color}
          strokeWidth={1}
        />
      ))}
      {xTicks?.map((tick, i) => (
        <line
          key={`v-${i}`}
          x1={tick.position}
          x2={tick.position}
          y1={margin.top}
          y2={height - margin.bottom}
          stroke={color}
          strokeWidth={1}
        />
      ))}
    </g>
  );
}
