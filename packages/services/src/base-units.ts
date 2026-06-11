/**
 * Exact base-unit → decimal-string conversion for on-chain amounts.
 *
 * Chain APIs return balances as integer base units (wei, satoshis, lamports,
 * microSTX). Converting via floats silently corrupts them: 2^53 wei is only
 * ~0.009 ETH, so `Number(BigInt(wei)) / 1e18` loses precision on virtually
 * every real balance. All arithmetic here is BigInt; no float is ever
 * involved, so the returned string is exact at full precision.
 */
export function formatBaseUnits(
  raw: string | number | bigint,
  decimals: number,
  displayDecimals?: number,
): string {
  let units: bigint;
  if (typeof raw === 'bigint') {
    units = raw;
  } else if (typeof raw === 'number') {
    // Numbers above 2^53 have already lost precision at JSON.parse; the
    // integer conversion below is exact for everything representable.
    units = BigInt(Math.trunc(raw));
  } else {
    const trimmed = raw.trim();
    if (!/^-?\d+$/.test(trimmed)) {
      throw new Error(`formatBaseUnits: expected an integer string, got "${raw}"`);
    }
    units = BigInt(trimmed);
  }

  const negative = units < 0n;
  const abs = negative ? -units : units;
  const base = 10n ** BigInt(decimals);
  const whole = (abs / base).toString();
  const fraction = decimals === 0 ? '' : (abs % base).toString().padStart(decimals, '0');

  const shownFraction =
    displayDecimals === undefined ? fraction : fraction.slice(0, displayDecimals);
  const body = shownFraction.length > 0 ? `${whole}.${shownFraction}` : whole;
  return negative ? `-${body}` : body;
}
