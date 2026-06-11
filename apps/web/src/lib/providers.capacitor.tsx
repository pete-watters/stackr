'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@stackr/ui';
import { ThemeProvider } from '@/components/theme-provider';
import { PostHogProvider, PostHogPageview } from '@/lib/posthog-provider';
import { useState, type ReactNode } from 'react';

// Watch-only provider set for the Capacitor (mobile) target. Mobile is
// watch-only by design: no wallet-connect, no signing. The wagmi / RainbowKit /
// WalletConnect / Solana wallet-adapter stack from `providers.tsx` is dropped
// here — both because it is unwanted on mobile and because several of those
// libraries break the static export. React Query, theming, tooltips and
// analytics are kept identical to the web build.
//
// This module is substituted for `@/lib/providers` only when
// `NEXT_PUBLIC_TARGET=capacitor` (see the webpack alias in `next.config.ts`), so
// the web build never imports or evaluates it.
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          <PostHogProvider>
            <PostHogPageview />
            {children}
          </PostHogProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
