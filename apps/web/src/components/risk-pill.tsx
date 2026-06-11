import { Badge, type BadgeVariant } from '@stackr/ui';

export interface RiskPillStyle {
  variant: BadgeVariant;
  label: string;
}

/**
 * Map a normalized `liquidationRisk` (0..1, `>= 1` == liquidatable) onto a
 * badge colour + label. Thresholds per ADR 0016 / issue #46:
 *   < 0.5      → success  ("Healthy")
 *   0.5–0.8    → warning  ("Caution")
 *   >= 0.8     → destructive ("At risk")
 *   >= 1       → destructive ("Liquidatable")
 * Pure, so the threshold mapping is unit-testable on its own.
 */
export function riskPillStyle(risk: number): RiskPillStyle {
  if (risk >= 1) return { variant: 'error', label: 'Liquidatable' };
  if (risk >= 0.8) return { variant: 'error', label: 'At risk' };
  if (risk >= 0.5) return { variant: 'warning', label: 'Caution' };
  return { variant: 'success', label: 'Healthy' };
}

interface RiskPillProps {
  risk: number;
}

export function RiskPill({ risk }: RiskPillProps) {
  const { variant, label } = riskPillStyle(risk);
  return <Badge variant={variant}>{label}</Badge>;
}
