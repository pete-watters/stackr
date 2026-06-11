/**
 * Pageview-path privacy: wallet addresses ride in route params
 * (`/wallet/[chain]/[address]`), so a raw pathname would hand PostHog the
 * very PII the analytics contract promises never to send. Every dynamic
 * segment that looks like an address is masked before capture.
 */

const ADDRESS_PATTERNS: RegExp[] = [
  /^0x[0-9a-fA-F]{16,}$/, // EVM (and SUI-style) hex addresses
  /^[0-9a-fA-F]{64}$/, // bare 32-byte hex
  /^(bc1|tb1)[02-9ac-hj-np-z]{8,}$/i, // Bitcoin bech32
  /^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/, // Bitcoin legacy base58
  /^S[PTM][0-9A-Z]{20,}$/, // Stacks c32
  /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, // Solana base58
];

function isAddressLike(segment: string): boolean {
  return ADDRESS_PATTERNS.some(pattern => pattern.test(segment));
}

/**
 * Mask address-like path segments. `/wallet/eth/0xabc…` becomes
 * `/wallet/eth/:address`; routes without dynamic segments pass through
 * unchanged. As a safety net, any future long opaque segment (≥ 30 chars)
 * is masked as `:param` so new dynamic routes fail private-by-default.
 */
export function sanitizePathname(pathname: string): string {
  return pathname
    .split('/')
    .map(segment => {
      if (segment.length === 0) return segment;
      if (isAddressLike(segment)) return ':address';
      if (segment.length >= 30 && /^[0-9a-zA-Z_-]+$/.test(segment)) return ':param';
      return segment;
    })
    .join('/');
}
