// Watch-only mobile (Capacitor) build: there is no wallet-connect. This stub is
// substituted for `@/components/wallet-connect-modal` (see next.config.ts) so the
// connect UI — and the wagmi / Solana / @stacks/connect libraries behind it — are
// neither shown nor bundled on mobile. The header renders nothing in its place.
export function WalletConnectModal() {
  return null;
}
