import { useMemo } from 'react';
import type { DataPoint, ChartDimensions } from '../core/types.js';
import { createLinearScale, computeDomainFromPoints } from '../core/scales.js';
import { generateLinePath } from '../core/line.js';
import { chartColors } from '../utils/color.js';
import { ChartContainer } from './chart-container.js';

export interface LineChartProps {
  data: DataPoint[];
  dimensions?: Partial<ChartDimensions>;
  color?: string;
  strokeWidth?: number;
  interpolation?: 'linear' | 'monotone';
  className?: string;
}

const defaultMargin = { top: 8, right: 8, bottom: 8, left: 8 };

export function LineChart({
  data,
  dimensions,
  color = chartColors.line,
  strokeWidth = 2,
  interpolation = 'monotone',
  className,
}: LineChartProps) {
  const width = dimensions?.width ?? 400;
  const height = dimensions?.height ?? 200;
  const margin = { ...defaultMargin, ...dimensions?.margin };

  const { path } = useMemo(() => {
    if (data.length < 2) return { path: '' };

    const { xDomain, yDomain } = computeDomainFromPoints(data);
    const scaleX = createLinearScale({
      domain: xDomain,
      range: [margin.left, width - margin.right],
    });
    const scaleY = createLinearScale({
      domain: yDomain,
      range: [height - margin.bottom, margin.top],
    });

    return { path: generateLinePath(data, scaleX, scaleY, interpolation) };
  }, [data, width, height, margin, interpolation]);

  return (
    <ChartContainer width={width} height={height} className={className}>
      {path && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </ChartContainer>
  );
}
