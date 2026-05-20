'use client';

import { Card, ChainAvatar, Skeleton, Badge } from '@stackr/ui';
import { formatFiat } from '@stackr/services';
import type { Currency } from '@stackr/models';
import { useAaveHealth } from '@/hooks/use-aave-health';
import { healthRiskLevel, riskMeta, formatHealthFactor } from '@/lib/defi/risk';

interface AaveHealthCardProps {
  address: string;
  currency?: Currency;
}

/**
 * Aave v3 liquidation-health card for one address. Renders nothing when the
 * address has no Aave borrow position (the hook returns null) — so a list of
 * these self-prunes to only addresses actually at risk.
 */
export function AaveHealthCard({ address, currency = 'usd' }: AaveHealthCardProps) {
  const { data, isLoading } = useAaveHealth(address);

  if (isLoading) return <Skeleton className="h-24 w-full rounded-lg" />;
  if (!data) return null;

  const level = healthRiskLevel(data.healthFactor);
  const meta = riskMeta(level);
  const truncated = `${address.slice(0, 6)}…${address.slice(-4)}`;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <ChainAvatar chain="eth" size="sm" />
          <div>
            <div className="text-sm font-semibold text-foreground">Aave v3</div>
            <div className="font-mono text-xs text-muted-foreground">{truncated}</div>
          </div>
        </div>
        <Badge>{meta.label}</Badge>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Health factor</div>
          <div className={`font-mono text-2xl font-bold ${meta.className}`}>
            {formatHealthFactor(data.healthFactor)}
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>
            Collateral{' '}
            <span className="font-mono text-foreground">
              {formatFiat(data.totalCollateralUsd, currency)}
            </span>
          </div>
          <div>
            Debt{' '}
            <span className="font-mono text-foreground">
              {formatFiat(data.totalDebtUsd, currency)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
