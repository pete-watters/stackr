import { useEffect, useId, useMemo, useRef, useState, type MouseEvent } from 'react';
import type { DataPoint } from '../core/types.js';
import { createLinearScale, computeDomainFromPoints } from '../core/scales.js';
import { generateLinePath } from '../core/line.js';
import { generateAreaPath } from '../core/area.js';
import { computeAxisTicks } from '../core/axis.js';
import { bisectNearest } from '../core/tooltip-math.js';
import { chartColors } from '../utils/color.js';
import { Axis } from './axis.js';
import { Grid } from './grid.js';
import { Crosshair } from './crosshair.js';
import { ChartTooltip } from './tooltip.js';

export interface PriceChartProps {
  /** Time-series points — `x` is a timestamp (ms), `y` is the price. */
  data: DataPoint[];
  height?: number;
  lineColor?: string;
  /** Area gradient colour; defaults to `lineColor`. */
  fillColor?: string;
  interpolation?: 'linear' | 'monotone';
  /** Formats the price (left axis + tooltip). */
  formatValue?: (value: number) => string;
  /** Formats the timestamp (bottom axis + tooltip). */
  formatTime?: (value: number) => string;
  className?: string;
}

const margin = { top: 16, right: 16, bottom: 28, left: 64 };
const DEFAULT_WIDTH = 640;

/**
 * A large, interactive price chart — axes, grid, gradient-filled area, and a
 * Kraken-style crosshair + tooltip that snaps to the nearest point on hover.
 * Width tracks its container (rendered 1:1 so hover maps cleanly to data).
 */
export function PriceChart({
  data,
  height = 360,
  lineColor = chartColors.line,
  fillColor,
  interpolation = 'monotone',
  formatValue = value => value.toLocaleString(),
  formatTime = value => new Date(value).toLocaleDateString(),
  className,
}: PriceChartProps) {
  const gradientId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [hoverX, setHoverX] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fill = fillColor ?? lineColor;

  const geometry = useMemo(() => {
    if (data.length < 2) return null;

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
      scaleX,
      scaleY,
      xDomain,
      yDomain,
      linePath: generateLinePath(data, scaleX, scaleY, interpolation),
      areaPath: generateAreaPath(data, scaleX, scaleY, baseline, interpolation),
    };
  }, [data, width, height, interpolation]);

  const hover = useMemo(() => {
    if (!geometry || hoverX === null) return null;
    const nearest = bisectNearest(data, hoverX, geometry.scaleX);
    if (!nearest) return null;
    return {
      px: geometry.scaleX(nearest.point.x),
      py: geometry.scaleY(nearest.point.y),
      point: nearest.point,
    };
  }, [geometry, hoverX, data]);

  const handleMove = (event: MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setHoverX(event.clientX - rect.left);
  };

  const handleLeave = () => setHoverX(null);

  if (!geometry) {
    return <div ref={containerRef} className={className} style={{ width: '100%', height }} />;
  }

  const xTicks = computeAxisTicks(geometry.xDomain, geometry.scaleX, 6, formatTime);
  const yTicks = computeAxisTicks(geometry.yDomain, geometry.scaleY, 5, formatValue);

  // Keep the tooltip box inside the plot area near the edges.
  const tooltipX = hover ? Math.min(hover.px, width - margin.right - 132) : 0;
  const tooltipY = hover ? Math.max(hover.py, margin.top + 28) : 0;

  return (
    <div ref={containerRef} className={className} style={{ width: '100%' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity={0.28} />
            <stop offset="100%" stopColor={fill} stopOpacity={0} />
          </linearGradient>
        </defs>

        <Grid xTicks={xTicks} yTicks={yTicks} width={width} height={height} margin={margin} />

        {geometry.areaPath && <path d={geometry.areaPath} fill={`url(#${gradientId})`} />}
        {geometry.linePath && (
          <path
            d={geometry.linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        <Axis
          domain={geometry.yDomain}
          scale={geometry.scaleY}
          orientation="left"
          position={margin.left}
          length={height - margin.top - margin.bottom}
          tickCount={5}
          formatTick={formatValue}
        />
        <Axis
          domain={geometry.xDomain}
          scale={geometry.scaleX}
          orientation="bottom"
          position={height - margin.bottom}
          length={width - margin.left - margin.right}
          tickCount={6}
          formatTick={formatTime}
        />

        {hover && (
          <>
            <Crosshair
              x={hover.px}
              y={hover.py}
              visible
              width={width}
              height={height}
              margin={margin}
            />
            <circle
              cx={hover.px}
              cy={hover.py}
              r={4}
              fill={lineColor}
              stroke={chartColors.tooltipBg}
              strokeWidth={2}
            />
            <ChartTooltip x={tooltipX} y={tooltipY} visible>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ opacity: 0.6, fontSize: 11 }}>{formatTime(hover.point.x)}</span>
                <span style={{ fontWeight: 600 }}>{formatValue(hover.point.y)}</span>
              </div>
            </ChartTooltip>
          </>
        )}
      </svg>
    </div>
  );
}
