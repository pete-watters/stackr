import { z } from 'zod';
import { ChainSchema } from './chain.js';

export const PriceSchema = z.object({
  chain: ChainSchema,
  usdPrice: z.number(),
  change24h: z.number(),
  updatedAt: z.string().datetime(),
});

export type Price = z.infer<typeof PriceSchema>;

export const PriceHistoryPointSchema = z.object({
  timestamp: z.number(),
  price: z.number(),
});

export type PriceHistoryPoint = z.infer<typeof PriceHistoryPointSchema>;
