import { WalletDetailView } from '@/components/wallet-detail-view';

// Wallet addresses are user-supplied watch-only data, so there is no finite set
// of paths to pre-render.
//
// Web build: return none and render any address on demand (default
// `dynamicParams: true`) — the existing deep-linkable UX.
//
// Capacitor static export: `output: 'export'` rejects this dynamic segment
// unless `generateStaticParams` yields at least one entry (an empty array is
// treated as missing). Mobile never links here — it reaches wallet detail
// through the static `/wallet/view` route (see `walletHref`) — so we emit a
// single throwaway placeholder purely to satisfy the exporter.
export function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_TARGET === 'capacitor') {
    return [{ chain: 'btc', address: 'unused' }];
  }
  return [];
}

export default async function WalletDetailPage({
  params,
}: {
  params: Promise<{ chain: string; address: string }>;
}) {
  const { chain, address } = await params;
  return <WalletDetailView chain={chain} address={address} />;
}
