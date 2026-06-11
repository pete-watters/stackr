import { clusterApiUrl } from '@solana/web3.js';

/** Same-origin route that proxies JSON-RPC to Helius with a server-only key. */
export const SOLANA_PROXY_PATH = '/api/rpc/solana';

/**
 * Public mainnet-beta RPC. Preserved as the fallback for SSR/prerender (where
 * there is no origin to build the proxy URL from) and mirrored server-side by
 * the proxy route when no Helius key is configured.
 */
export const solanaPublicEndpoint = clusterApiUrl('mainnet-beta');

/**
 * Resolve the endpoint the Solana `ConnectionProvider` should use.
 *
 * Browser: point at the same-origin proxy so the Helius key stays server-side.
 * The proxy forwards to Helius when a key is set and to the public cluster
 * otherwise, so local dev without a secret keeps working through the same URL.
 *
 * SSR/prerender: `@solana/web3.js`'s `Connection` needs an absolute URL and
 * there is no `window.location.origin`, so fall back to the public cluster. The
 * provider only issues real RPC calls on the client, where the proxy takes over.
 *
 * `origin` is a parameter (not read inline) so the resolution is pure and
 * unit-testable for both the browser and SSR cases.
 */
export function resolveSolanaEndpoint(
  origin: string | undefined = typeof window === 'undefined' ? undefined : window.location.origin,
): string {
  if (!origin) return solanaPublicEndpoint;
  return new URL(SOLANA_PROXY_PATH, origin).toString();
}

export const solanaEndpoint = resolveSolanaEndpoint();
