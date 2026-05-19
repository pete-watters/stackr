import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Wallet, CreateWallet, Chain } from '@stackr/models';

interface WalletState {
  wallets: Wallet[];
  connectedAddresses: Partial<Record<Chain, string[]>>;
  addWallet: (wallet: CreateWallet) => void;
  removeWallet: (id: string) => void;
  updateLabel: (id: string, label: string) => void;
  setConnectedAddresses: (chain: Chain, addresses: string[]) => void;
  clearConnectedAddresses: (chain: Chain) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    set => ({
      wallets: [],
      connectedAddresses: {},
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
      setConnectedAddresses: (chain, addresses) =>
        set(state => ({
          connectedAddresses: { ...state.connectedAddresses, [chain]: addresses },
        })),
      clearConnectedAddresses: chain =>
        set(state => {
          const next = { ...state.connectedAddresses };
          delete next[chain];
          return { connectedAddresses: next };
        }),
    }),
    {
      name: 'stackr-wallets',
      // connectedAddresses is intentionally excluded — wagmi handles reconnect
      partialize: state => ({ wallets: state.wallets }),
    },
  ),
);
