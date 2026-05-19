import { z } from 'zod';
import { ChainSchema } from './chain.js';

export const BalanceSchema = z.object({
  chain: ChainSchema,
  address: z.string(),
  /** Raw balance in smallest denomination (satoshis, lamports, wei, micro-STX) */
  rawBalance: z.string(),
  /** Human-readable balance */
  balance: z.string(),
  /** Balance in USD (if price data available) */
  usdValue: z.string().optional(),
  /** Timestamp of last update */
  updatedAt: z.string().datetime(),
});

export type Balance = z.infer<typeof BalanceSchema>;
