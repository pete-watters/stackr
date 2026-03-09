'use client';

import { chainMeta } from '@stackr/models';
import type { Chain } from '@stackr/models';
import { Card } from '@stackr/ui';

interface Allocation {
  chain: Chain;
  usdValue: number;
  percentage: number;
}

interface PortfolioBreakdownProps {
  allocations: Allocation[];
}

const chainBarColors: Record<Chain, string> = {
  btc: '#F7931A',
  eth: '#627EEA',
  stx: '#5546FF',
  sol: '#9945FF',
};

export function PortfolioBreakdown({ allocations }: PortfolioBreakdownProps) {
  if (allocations.length === 0) return null;

  const sorted = [...allocations].sort((a, b) => b.percentage - a.percentage);

  return (
    <Card className="p-4 mb-6">
      <div className="text-sm text-muted-foreground mb-3">Allocation</div>

      {/* Stacked bar */}
      <div className="flex h-2 rounded-full overflow-hidden mb-3">
        {sorted.map(a => (
          <div
            key={a.chain}
            style={{
              width: `${a.percentage}%`,
              backgroundColor: chainBarColors[a.chain],
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {sorted.map(a => (
          <div key={a.chain} className="flex items-center gap-1">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: chainBarColors[a.chain] }}
            />
            <span className="text-xs text-muted-foreground">
              {chainMeta[a.chain].symbol} {a.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
