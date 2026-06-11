'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { WalletDetailView } from '@/components/wallet-detail-view';

// Static, export-friendly wallet-detail route used by the Capacitor target,
// where the dynamic `/wallet/[chain]/[address]` segment cannot be pre-rendered.
// Chain and address are resolved client-side from the query string
// (`/wallet/view?chain=...&address=...`), produced by `walletHref` under the
// mobile build. The route also exists in the web build but is never linked to
// there, so web UX is unchanged.
function WalletViewInner() {
  const searchParams = useSearchParams();
  const chain = searchParams.get('chain') ?? '';
  const address = searchParams.get('address') ?? '';
  return <WalletDetailView chain={chain} address={address} />;
}

export default function WalletViewPage() {
  return (
    <Suspense>
      <WalletViewInner />
    </Suspense>
  );
}
