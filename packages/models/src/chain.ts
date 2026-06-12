import { z } from 'zod';

export const ChainSchema = z.enum(['btc', 'stx', 'eth', 'sol', 'sui']);

export type Chain = z.infer<typeof ChainSchema>;

export const chainMeta: Record<Chain, { name: string; symbol: string; decimals: number }> = {
  btc: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
  stx: { name: 'Stacks', symbol: 'STX', decimals: 6 },
  eth: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  sol: { name: 'Solana', symbol: 'SOL', decimals: 9 },
  // SUI is denominated in MIST: 1 SUI = 1e9 MIST.
  sui: { name: 'Sui', symbol: 'SUI', decimals: 9 },
};
