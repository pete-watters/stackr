import { z } from 'zod';
import { ChainSchema } from './chain.js';

export const WalletSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(64),
  chain: ChainSchema,
  address: z.string().min(1),
  createdAt: z.string().datetime(),
});

export type Wallet = z.infer<typeof WalletSchema>;

export const CreateWalletSchema = WalletSchema.omit({ id: true, createdAt: true });

export type CreateWallet = z.infer<typeof CreateWalletSchema>;
