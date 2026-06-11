'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { CustomThemeStyle } from '@/components/custom-theme-style';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="terminal"
      themes={['terminal', 'kraken', 'leather', 'onyx', 'custom']}
      value={{
        terminal: 'theme-terminal',
        kraken: 'theme-kraken',
        leather: 'theme-leather',
        onyx: 'theme-onyx',
        // `custom` has no CSS block of its own — it inherits a base theme and
        // overlays inline token overrides via CustomThemeStyle. Pre-hydration we
        // paint the dark terminal canvas so a reload never flashes the light
        // `:root` defaults before the effect runs.
        custom: 'theme-terminal',
      }}
      enableSystem={false}
      disableTransitionOnChange
    >
      <CustomThemeStyle />
      {children}
    </NextThemesProvider>
  );
}
