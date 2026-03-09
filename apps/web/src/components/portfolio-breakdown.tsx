'use client';

import { chainMeta } from '@stackr/models';
import type { Chain } from '@stackr/models';
import { css } from 'styled-system/css';

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
    <div
      className={css({
        p: 'space.04',
        bg: 'ink.component-bg-default',
        borderRadius: 'lg',
        border: '1px solid',
        borderColor: 'ink.border-subtle',
        mb: 'space.05',
      })}
    >
      <div
        className={css({
          textStyle: 'label.02',
          color: 'ink.text-secondary',
          mb: 'space.03',
        })}
      >
        Allocation
      </div>

      {/* Stacked bar */}
      <div
        className={css({
          display: 'flex',
          height: '8px',
          borderRadius: 'round',
          overflow: 'hidden',
          mb: 'space.03',
        })}
      >
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
      <div className={css({ display: 'flex', flexWrap: 'wrap', gap: 'space.03' })}>
        {sorted.map(a => (
          <div
            key={a.chain}
            className={css({ display: 'flex', alignItems: 'center', gap: 'space.01' })}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: chainBarColors[a.chain],
              }}
            />
            <span className={css({ textStyle: 'caption.01', color: 'ink.text-secondary' })}>
              {chainMeta[a.chain].symbol} {a.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
