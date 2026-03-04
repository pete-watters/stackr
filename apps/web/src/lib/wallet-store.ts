import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Wallet, CreateWallet } from '@stackr/models';

interface WalletState {
  wallets: Wallet[];
  addWallet: (wallet: CreateWallet) => void;
  removeWallet: (id: string) => void;
  updateLabel: (id: string, label: string) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    set => ({
      wallets: [],
      addWallet: input =>
        set(state => ({
          wallets: [
            ...state.wallets,
            {
              ...input,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      removeWallet: id =>
        set(state => ({
          wallets: state.wallets.filter(w => w.id !== id),
        })),
      updateLabel: (id, label) =>
        set(state => ({
          wallets: state.wallets.map(w => (w.id === id ? { ...w, label } : w)),
        })),
    }),
    { name: 'stackr-wallets' },
  ),
);
