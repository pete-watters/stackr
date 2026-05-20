/**
 * Map a lending-position health factor to a risk level. This is the core of
 * the "am I about to get liquidated?" signal — chain-agnostic, so Aave (EVM),
 * Kamino (SOL), and Zest/Granite (STX) can all funnel their computed HF here.
 *
 * A health factor < 1 means the position can be liquidated right now.
 */
export type RiskLevel = 'safe' | 'caution' | 'danger';

export function healthRiskLevel(healthFactor: number): RiskLevel {
  if (healthFactor < 1.1) return 'danger';
  if (healthFactor < 2) return 'caution';
  return 'safe';
}

const RISK_META: Record<RiskLevel, { label: string; className: string }> = {
  safe: { label: 'Healthy', className: 'text-emerald-500' },
  caution: { label: 'Watch', className: 'text-amber-500' },
  danger: { label: 'Near liquidation', className: 'text-red-500' },
};

export function riskMeta(level: RiskLevel) {
  return RISK_META[level];
}

/** Health factors can be astronomically large; cap the display. */
export function formatHealthFactor(hf: number): string {
  if (hf >= 1000) return '1000+';
  return hf.toFixed(2);
}
