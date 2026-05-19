import { z } from 'zod';

export const ChainSchema = z.enum(['btc', 'stx', 'eth', 'sol']);

export type Chain = z.infer<typeof ChainSchema>;

export const chainMeta: Record<Chain, { name: string; symbol: string; decimals: number }> = {
  btc: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
  stx: { name: 'Stacks', symbol: 'STX', decimals: 6 },
  eth: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  sol: { name: 'Solana', symbol: 'SOL', decimals: 9 },
};
