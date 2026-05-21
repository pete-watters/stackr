'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="terminal"
      themes={['terminal', 'kraken', 'leather', 'onyx']}
      value={{
        terminal: 'theme-terminal',
        kraken: 'theme-kraken',
        leather: 'theme-leather',
        onyx: 'theme-onyx',
      }}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
