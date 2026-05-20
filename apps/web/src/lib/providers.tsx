'use client';

import '@rainbow-me/rainbowkit/styles.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { TooltipProvider } from '@stackr/ui';
import { ThemeProvider } from '@/components/theme-provider';
import { ConnectedAddressSync } from '@/components/connected-address-sync';
import { ConnectedSolanaAddressSync } from '@/components/connected-solana-address-sync';
import { wagmiConfig } from '@/lib/wagmi-config';
import { solanaEndpoint } from '@/lib/solana-config';
import { useMemo, useState, type ReactNode } from 'react';

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

  const solanaWallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ThemeProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <ConnectionProvider endpoint={solanaEndpoint}>
              <WalletProvider wallets={solanaWallets} autoConnect>
                <WalletModalProvider>
                  <TooltipProvider delayDuration={300}>
                    <ConnectedAddressSync />
                    <ConnectedSolanaAddressSync />
                    {children}
                  </TooltipProvider>
                </WalletModalProvider>
              </WalletProvider>
            </ConnectionProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
