'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

const themes = ['light', 'dark', 'midnight', 'kraken', 'solarized-dark', 'high-contrast'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      themes={themes}
    >
      {children}
    </NextThemesProvider>
  );
}
