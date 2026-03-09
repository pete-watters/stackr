import { z } from 'zod';

export const CurrencySchema = z.enum(['usd', 'eur', 'gbp', 'jpy', 'cad', 'aud']);
export type Currency = z.infer<typeof CurrencySchema>;

export const currencyMeta: Record<Currency, { symbol: string; name: string; locale: string }> = {
  usd: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  eur: { symbol: '\u20AC', name: 'Euro', locale: 'de-DE' },
  gbp: { symbol: '\u00A3', name: 'British Pound', locale: 'en-GB' },
  jpy: { symbol: '\u00A5', name: 'Japanese Yen', locale: 'ja-JP' },
  cad: { symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  aud: { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
};
