import { useMemo } from 'react';
import type { DepthOrder, ChartDimensions } from '../core/types.js';
import { createLinearScale, computeDomain } from '../core/scales.js';
import { generateBidPath, generateAskPath, generateDepthLinePath } from '../core/depth-chart.js';
import { useCssChartColors } from '../utils/use-css-chart-colors.js';
import { ChartContainer } from './chart-container.js';

export interface DepthChartProps {
  bids: DepthOrder[];
  asks: DepthOrder[];
  dimensions?: Partial<ChartDimensions>;
  bidColor?: string;
  askColor?: string;
  bidFillColor?: string;
  askFillColor?: string;
  className?: string;
}

const defaultMargin = { top: 16, right: 16, bottom: 32, left: 16 };

export function DepthChart({
  bids,
  asks,
  dimensions,
  bidColor,
  askColor,
  bidFillColor,
  askFillColor,
  className,
}: DepthChartProps) {
  const theme = useCssChartColors();
  const resolvedBidColor = bidColor ?? theme.bid;
  const resolvedAskColor = askColor ?? theme.ask;
  const resolvedBidFillColor = bidFillColor ?? theme.bidFill;
  const resolvedAskFillColor = askFillColor ?? theme.askFill;
  const width = dimensions?.width ?? 600;
  const height = dimensions?.height ?? 300;
  const margin = { ...defaultMargin, ...dimensions?.margin };

  const { bidAreaPath, askAreaPath, bidLine, askLine, midPrice } = useMemo(() => {
    if (bids.length === 0 && asks.length === 0) {
      return { bidAreaPath: '', askAreaPath: '', bidLine: '', askLine: '', midPrice: 0 };
    }

    const allPrices = [...bids.map(o => o.price), ...asks.map(o => o.price)];
    const allAmounts = [...bids.map(o => o.cumulativeAmount), ...asks.map(o => o.cumulativeAmount)];

    const priceDomain = computeDomain(allPrices, 0.02);
    const amountDomain: [number, number] = [0, Math.max(...allAmounts, 1)];

    const scaleX = createLinearScale({
      domain: priceDomain,
      range: [margin.left, width - margin.right],
    });
    const scaleY = createLinearScale({
      domain: amountDomain,
      range: [height - margin.bottom, margin.top],
    });

    const baseline = height - margin.bottom;

    const bestBid = bids.length > 0 ? Math.max(...bids.map(b => b.price)) : 0;
    const bestAsk = asks.length > 0 ? Math.min(...asks.map(a => a.price)) : 0;
    const mid = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : bestBid || bestAsk;

    return {
      bidAreaPath: generateBidPath(bids, scaleX, scaleY, baseline),
      askAreaPath: generateAskPath(asks, scaleX, scaleY, baseline),
      bidLine: generateDepthLinePath(bids, scaleX, scaleY, false),
      askLine: generateDepthLinePath(asks, scaleX, scaleY, true),
      midPrice: scaleX(mid),
    };
  }, [bids, asks, width, height, margin]);

  return (
    <ChartContainer width={width} height={height} className={className}>
      {/* Grid line at midprice */}
      {midPrice > 0 && (
        <line
          x1={midPrice}
          x2={midPrice}
          y1={margin.top}
          y2={height - margin.bottom}
          stroke={theme.crosshair}
          strokeDasharray="4,4"
        />
      )}

      {/* Bid area + line */}
      {bidAreaPath && <path d={bidAreaPath} fill={resolvedBidFillColor} />}
      {bidLine && <path d={bidLine} fill="none" stroke={resolvedBidColor} strokeWidth={1.5} />}

      {/* Ask area + line */}
      {askAreaPath && <path d={askAreaPath} fill={resolvedAskFillColor} />}
      {askLine && <path d={askLine} fill="none" stroke={resolvedAskColor} strokeWidth={1.5} />}
    </ChartContainer>
  );
}
