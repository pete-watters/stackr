import { useMemo } from 'react';
import type { DataPoint, ChartDimensions } from '../core/types.js';
import { createLinearScale, computeDomainFromPoints } from '../core/scales.js';
import { generateLinePath } from '../core/line.js';
import { generateAreaPath } from '../core/area.js';
import { chartColors } from '../utils/color.js';
import { ChartContainer } from './chart-container.js';

export interface AreaChartProps {
  data: DataPoint[];
  dimensions?: Partial<ChartDimensions>;
  lineColor?: string;
  fillColor?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  interpolation?: 'linear' | 'monotone';
  className?: string;
}

const defaultMargin = { top: 8, right: 8, bottom: 8, left: 8 };

export function AreaChart({
  data,
  dimensions,
  lineColor = chartColors.line,
  fillColor = chartColors.line,
  fillOpacity = 0.1,
  strokeWidth = 2,
  interpolation = 'monotone',
  className,
}: AreaChartProps) {
  const width = dimensions?.width ?? 400;
  const height = dimensions?.height ?? 200;
  const margin = { ...defaultMargin, ...dimensions?.margin };

  const { linePath, areaPath } = useMemo(() => {
    if (data.length < 2) return { linePath: '', areaPath: '' };

    const { xDomain, yDomain } = computeDomainFromPoints(data);
    const scaleX = createLinearScale({
      domain: xDomain,
      range: [margin.left, width - margin.right],
    });
    const scaleY = createLinearScale({
      domain: yDomain,
      range: [height - margin.bottom, margin.top],
    });

    const baseline = height - margin.bottom;

    return {
      linePath: generateLinePath(data, scaleX, scaleY, interpolation),
      areaPath: generateAreaPath(data, scaleX, scaleY, baseline, interpolation),
    };
  }, [data, width, height, margin, interpolation]);

  return (
    <ChartContainer width={width} height={height} className={className}>
      {areaPath && <path d={areaPath} fill={fillColor} opacity={fillOpacity} />}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </ChartContainer>
  );
}
