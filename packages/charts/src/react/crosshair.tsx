import { chartColors } from '../utils/color.js';

export interface CrosshairProps {
  x: number;
  y: number;
  visible: boolean;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  color?: string;
}

/**
 * Crosshair overlay — Kraken-style dashed lines that follow mouse position.
 */
export function Crosshair({
  x,
  y,
  visible,
  width,
  height,
  margin,
  color = chartColors.crosshair,
}: CrosshairProps) {
  if (!visible) return null;

  return (
    <g>
      {/* Vertical line */}
      <line
        x1={x}
        x2={x}
        y1={margin.top}
        y2={height - margin.bottom}
        stroke={color}
        strokeWidth={1}
        strokeDasharray="4,4"
      />
      {/* Horizontal line */}
      <line
        x1={margin.left}
        x2={width - margin.right}
        y1={y}
        y2={y}
        stroke={color}
        strokeWidth={1}
        strokeDasharray="4,4"
      />
      {/* Intersection dot */}
      <circle cx={x} cy={y} r={3} fill={color} />
    </g>
  );
}
