import { z } from 'zod';

export const OrderSchema = z.object({
  price: z.number(),
  amount: z.number(),
  cumulativeAmount: z.number(),
});

export type Order = z.infer<typeof OrderSchema>;

export const OrderBookSchema = z.object({
  bids: z.array(OrderSchema),
  asks: z.array(OrderSchema),
  pair: z.string(),
  updatedAt: z.string().datetime(),
});

export type OrderBook = z.infer<typeof OrderBookSchema>;
