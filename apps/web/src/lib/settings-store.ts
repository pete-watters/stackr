import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Currency } from '@stackr/models';
import {
  defaultCustomTheme,
  THEME_SEEDS,
  type BaseThemeId,
  type CustomTheme,
  type CustomThemeTokenKey,
} from './custom-theme';

interface SettingsState {
  etherscanApiKey: string;
  setEtherscanApiKey: (key: string) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  alphaVantageApiKey: string;
  setAlphaVantageApiKey: (key: string) => void;
  hideBalance: boolean;
  toggleHideBalance: () => void;
  customTheme: CustomTheme;
  setCustomThemeBase: (base: BaseThemeId) => void;
  setCustomThemeToken: (key: CustomThemeTokenKey, value: string) => void;
  resetCustomTheme: () => void;
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
      hideBalance: false,
      toggleHideBalance: () => set(s => ({ hideBalance: !s.hideBalance })),
      customTheme: defaultCustomTheme(),
      // Picking a base reseeds the palette — the base theme is the starting point.
      setCustomThemeBase: base => set({ customTheme: { base, tokens: { ...THEME_SEEDS[base] } } }),
      setCustomThemeToken: (key, value) =>
        set(s => ({
          customTheme: { ...s.customTheme, tokens: { ...s.customTheme.tokens, [key]: value } },
        })),
      resetCustomTheme: () =>
        set(s => ({
          customTheme: { ...s.customTheme, tokens: { ...THEME_SEEDS[s.customTheme.base] } },
        })),
    }),
    {
      name: 'stackr-settings',
      partialize: state => ({
        etherscanApiKey: state.etherscanApiKey,
        currency: state.currency,
        alphaVantageApiKey: state.alphaVantageApiKey,
        customTheme: state.customTheme,
      }),
    },
  ),
);
