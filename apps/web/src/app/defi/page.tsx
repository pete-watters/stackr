'use client';

import { Header } from '@/components/header';
import { AaveHealthCard } from '@/components/aave-health-card';
import { useWalletStore } from '@/lib/wallet-store';
import { useSettingsStore } from '@/lib/settings-store';

export default function DefiPage() {
  const wallets = useWalletStore(s => s.wallets);
  const connectedAddresses = useWalletStore(s => s.connectedAddresses);
  const currency = useSettingsStore(s => s.currency);

  // Every ETH address we know about — connected wallets + watch-only — deduped.
  const ethAddresses = Array.from(
    new Set(
      [
        ...(connectedAddresses.eth ?? []),
        ...wallets.filter(w => w.chain === 'eth').map(w => w.address),
      ].map(a => a.toLowerCase()),
    ),
  );

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">DeFi</h1>
          <p className="text-sm text-muted-foreground">
            Lending positions and how close they are to liquidation. Cards show only addresses with
            an open borrow position.
          </p>
        </div>

        {ethAddresses.length === 0 ? (
          <div className="rounded-lg border border-dashed px-6 py-12 text-center text-muted-foreground">
            <p className="mb-2 text-base">No Ethereum addresses yet</p>
            <p className="text-sm">
              Connect MetaMask or add a watch-only ETH address to monitor Aave health.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ethAddresses.map(addr => (
              <AaveHealthCard key={addr} address={addr} currency={currency} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
