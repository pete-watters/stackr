import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Currency } from '@stackr/models';

interface SettingsState {
  etherscanApiKey: string;
  setEtherscanApiKey: (key: string) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  alphaVantageApiKey: string;
  setAlphaVantageApiKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      etherscanApiKey: '',
      setEtherscanApiKey: key => set({ etherscanApiKey: key }),
      currency: 'usd',
      setCurrency: currency => set({ currency }),
      alphaVantageApiKey: '',
      setAlphaVantageApiKey: key => set({ alphaVantageApiKey: key }),
    }),
    { name: 'stackr-settings' },
  ),
);
