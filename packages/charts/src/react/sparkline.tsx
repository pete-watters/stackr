import { useMemo } from 'react';
import { generateSparklinePath } from '../core/sparkline.js';
import { useCssChartColors } from '../utils/use-css-chart-colors.js';

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 32,
  color,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  const theme = useCssChartColors();
  const resolvedColor =
    color ?? (data.length >= 2 && data[data.length - 1] >= data[0] ? theme.bid : theme.ask);

  const path = useMemo(() => generateSparklinePath(data, width, height), [data, width, height]);

  if (!path) return null;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      <path
        d={path}
        fill="none"
        stroke={resolvedColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
