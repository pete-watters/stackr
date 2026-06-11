import { z } from 'zod';
import { ChainSchema } from './chain.js';
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

export const CryptoHoldingSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('crypto'),
  chain: ChainSchema,
  // Manual positions are off-chain balances (exchange, paper, a partner's stack),
  // so a holding only makes sense with a strictly positive size.
  quantity: z.number().positive(),
  label: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type CryptoHolding = z.infer<typeof CryptoHoldingSchema>;

export const HoldingSchema = z.discriminatedUnion('type', [
  CashHoldingSchema,
  StockHoldingSchema,
  CryptoHoldingSchema,
]);

export type Holding = z.infer<typeof HoldingSchema>;
