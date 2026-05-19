'use client';

import type { Currency } from '@stackr/models';
import { formatFiat, formatChange } from '@stackr/services';
import { Badge, Card, Skeleton } from '@stackr/ui';
import { Sparkline } from '@stackr/charts/react';

interface PortfolioSummaryProps {
  totalFiat: number;
  currency: Currency;
  change24h?: number;
  sparklineData?: number[];
  isLoading: boolean;
}

export function PortfolioSummary({
  totalFiat,
  currency,
  change24h,
  sparklineData,
  isLoading,
}: PortfolioSummaryProps) {
  return (
    <Card className="p-6 mb-6">
      <div className="text-sm text-muted-foreground mb-2">Total Portfolio Value</div>
      <div className="flex items-center gap-4">
        <div>
          {isLoading ? (
            <Skeleton width={180} height="2.5rem" />
          ) : (
            <div className="text-3xl font-mono font-bold text-foreground">
              {formatFiat(totalFiat, currency)}
            </div>
          )}
          {!isLoading && change24h !== undefined && (
            <Badge variant={change24h >= 0 ? 'success' : 'error'} className="mt-1">
              {formatChange(change24h)}
            </Badge>
          )}
        </div>
        {sparklineData && sparklineData.length >= 2 && (
          <div className="ml-auto">
            <Sparkline data={sparklineData} width={120} height={40} />
          </div>
        )}
      </div>
    </Card>
  );
}
