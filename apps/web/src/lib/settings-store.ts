import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  etherscanApiKey: string;
  setEtherscanApiKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      etherscanApiKey: '',
      setEtherscanApiKey: key => set({ etherscanApiKey: key }),
    }),
    { name: 'stackr-settings' },
  ),
);
