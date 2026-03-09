import type { ReactNode } from 'react';
import { chartColors } from '../utils/color.js';

export interface TooltipProps {
  x: number;
  y: number;
  visible: boolean;
  children: ReactNode;
}

export function ChartTooltip({ x, y, visible, children }: TooltipProps) {
  if (!visible) return null;

  return (
    <foreignObject x={x + 10} y={y - 20} width={140} height={60}>
      <div
        style={{
          background: chartColors.tooltipBg,
          border: `1px solid ${chartColors.grid}`,
          borderRadius: 6,
          padding: '6px 10px',
          fontSize: 12,
          fontFamily: 'system-ui, sans-serif',
          color: 'white',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </div>
    </foreignObject>
  );
}
