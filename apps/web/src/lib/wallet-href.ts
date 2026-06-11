// Build-target-aware link to a wallet's detail view.
//
// Web build: the server route `/wallet/[chain]/[address]` (existing UX).
// Capacitor build: the static, client-resolved `/wallet/view?chain=&address=`
// route, because the dynamic segment cannot be statically exported.
//
// `NEXT_PUBLIC_TARGET` is inlined at build time, so the unused branch is dead
// code in each target.
export const IS_CAPACITOR = process.env.NEXT_PUBLIC_TARGET === 'capacitor';

export function walletHref(chain: string, address: string): string {
  if (IS_CAPACITOR) {
    return `/wallet/view?chain=${encodeURIComponent(chain)}&address=${encodeURIComponent(address)}`;
  }
  return `/wallet/${chain}/${address}`;
}
