import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Holding, CashHolding, StockHolding, Currency } from '@stackr/models';

interface HoldingsState {
  holdings: Holding[];
  addCashHolding: (input: {
    label: string;
    amount: number;
    currency: Currency;
    interestRate: number;
  }) => void;
  addStockHolding: (input: {
    symbol: string;
    name: string;
    shares: number;
    avgCostBasis?: number;
  }) => void;
  removeHolding: (id: string) => void;
  updateHolding: (id: string, updates: Partial<Omit<Holding, 'id' | 'type' | 'createdAt'>>) => void;
}

export const useHoldingsStore = create<HoldingsState>()(
  persist(
    set => ({
      holdings: [],
      addCashHolding: input =>
        set(state => ({
          holdings: [
            ...state.holdings,
            {
              ...input,
              id: crypto.randomUUID(),
              type: 'cash' as const,
              createdAt: new Date().toISOString(),
            } satisfies CashHolding,
          ],
        })),
      addStockHolding: input =>
        set(state => ({
          holdings: [
            ...state.holdings,
            {
              ...input,
              id: crypto.randomUUID(),
              type: 'stock' as const,
              createdAt: new Date().toISOString(),
            } satisfies StockHolding,
          ],
        })),
      removeHolding: id =>
        set(state => ({
          holdings: state.holdings.filter(h => h.id !== id),
        })),
      updateHolding: (id, updates) =>
        set(state => ({
          holdings: state.holdings.map(h => (h.id === id ? { ...h, ...updates } : h)),
        })),
    }),
    { name: 'stackr-holdings' },
  ),
);
