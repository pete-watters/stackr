'use client';

import { formatUsd, formatChange } from '@stackr/services';
import { Badge, Skeleton } from '@stackr/ui';
import { Sparkline } from '@stackr/charts/react';
import { css } from 'styled-system/css';

interface PortfolioSummaryProps {
  totalUsd: number;
  change24h?: number;
  sparklineData?: number[];
  isLoading: boolean;
}

export function PortfolioSummary({
  totalUsd,
  change24h,
  sparklineData,
  isLoading,
}: PortfolioSummaryProps) {
  return (
    <div
      className={css({
        p: 'space.05',
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
          mb: 'space.02',
        })}
      >
        Total Portfolio Value
      </div>
      <div className={css({ display: 'flex', alignItems: 'center', gap: 'space.04' })}>
        <div>
          {isLoading ? (
            <Skeleton width={180} height="2.5rem" className="skeleton" />
          ) : (
            <div className={css({ textStyle: 'mono.01', color: 'ink.text-primary' })}>
              {formatUsd(totalUsd)}
            </div>
          )}
          {!isLoading && change24h !== undefined && (
            <Badge
              variant={change24h >= 0 ? 'success' : 'error'}
              className={`badge badge--${change24h >= 0 ? 'success' : 'error'}`}
              style={{ marginTop: 4 }}
            >
              {formatChange(change24h)}
            </Badge>
          )}
        </div>
        {sparklineData && sparklineData.length >= 2 && (
          <div className={css({ ml: 'auto' })}>
            <Sparkline data={sparklineData} width={120} height={40} />
          </div>
        )}
      </div>
    </div>
  );
}
