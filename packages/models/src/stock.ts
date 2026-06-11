import { z } from 'zod';

/**
 * A symbol-search match (Alpha Vantage `SYMBOL_SEARCH`). Normalized into a
 * vendor-neutral shape so the app never sees Alpha Vantage's numbered keys
 * (`"1. symbol"`, `"2. name"`, …).
 */
export const StockSearchResultSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  type: z.string(),
  region: z.string(),
  currency: z.string(),
});

export type StockSearchResult = z.infer<typeof StockSearchResultSchema>;

/**
 * A point-in-time stock quote (Alpha Vantage `GLOBAL_QUOTE`), normalized to
 * numbers the UI can render directly.
 */
export const StockQuoteSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
});

export type StockQuote = z.infer<typeof StockQuoteSchema>;
