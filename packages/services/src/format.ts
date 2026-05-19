import type { Currency } from '@stackr/models';
import { currencyMeta } from '@stackr/models';

export function formatFiat(value: number, currency: Currency = 'usd'): string {
  const meta = currencyMeta[currency];
  return new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** @deprecated Use formatFiat(value, 'usd') instead */
export function formatUsd(value: number): string {
  return formatFiat(value, 'usd');
}

export function formatCrypto(value: number | string, decimals: number = 6): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}
