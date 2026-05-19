import { z } from 'zod';
import { ChainSchema } from './chain.js';

export const TransactionSchema = z.object({
  hash: z.string(),
  chain: ChainSchema,
  type: z.enum(['send', 'receive']),
  amount: z.string(),
  counterparty: z.string(),
  timestamp: z.string().datetime(),
  confirmed: z.boolean(),
});

export type Transaction = z.infer<typeof TransactionSchema>;
