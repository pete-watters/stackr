import { z } from 'zod';
import { CurrencySchema } from './currency.js';

export const CashHoldingSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('cash'),
  label: z.string(),
  amount: z.number(),
  currency: CurrencySchema,
  interestRate: z.number().min(0).max(100),
  createdAt: z.string().datetime(),
});

export type CashHolding = z.infer<typeof CashHoldingSchema>;

export const StockHoldingSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('stock'),
  symbol: z.string(),
  name: z.string(),
  shares: z.number(),
  avgCostBasis: z.number().optional(),
  createdAt: z.string().datetime(),
});

export type StockHolding = z.infer<typeof StockHoldingSchema>;

export const HoldingSchema = z.discriminatedUnion('type', [CashHoldingSchema, StockHoldingSchema]);

export type Holding = z.infer<typeof HoldingSchema>;
