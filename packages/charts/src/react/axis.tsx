import { computeAxisTicks, type TickData } from '../core/axis.js';
import { chartColors } from '../utils/color.js';

export interface AxisProps {
  domain: [number, number];
  scale: (v: number) => number;
  orientation: 'bottom' | 'left';
  position: number;
  tickCount?: number;
  formatTick?: (value: number) => string;
  length: number;
  color?: string;
}

export function Axis({
  domain,
  scale,
  orientation,
  position,
  tickCount = 5,
  formatTick,
  length,
  color = chartColors.text,
}: AxisProps) {
  const ticks = computeAxisTicks(domain, scale, tickCount, formatTick);

  if (orientation === 'bottom') {
    return (
      <g>
        {ticks.map((tick, i) => (
          <g key={i} transform={`translate(${tick.position}, ${position})`}>
            <line y2={6} stroke={color} strokeWidth={1} />
            <text
              y={18}
              textAnchor="middle"
              fill={color}
              fontSize={10}
              fontFamily="system-ui, sans-serif"
            >
              {tick.label}
            </text>
          </g>
        ))}
      </g>
    );
  }

  return (
    <g>
      {ticks.map((tick, i) => (
        <g key={i} transform={`translate(${position}, ${tick.position})`}>
          <line x2={-6} stroke={color} strokeWidth={1} />
          <text
            x={-10}
            textAnchor="end"
            dominantBaseline="central"
            fill={color}
            fontSize={10}
            fontFamily="system-ui, sans-serif"
          >
            {tick.label}
          </text>
        </g>
      ))}
    </g>
  );
}
