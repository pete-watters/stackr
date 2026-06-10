import { describe, expect, it } from 'vitest';
import { resolveSolanaEndpoint, solanaPublicEndpoint, SOLANA_PROXY_PATH } from './solana-config';

describe('resolveSolanaEndpoint', () => {
  it('points at the same-origin proxy when an origin is available (browser)', () => {
    expect(resolveSolanaEndpoint('https://stackr.app')).toBe(
      `https://stackr.app${SOLANA_PROXY_PATH}`,
    );
  });

  it('falls back to the public cluster when there is no origin (SSR/prerender)', () => {
    // During SSR `window.location.origin` is absent; the resolver collapses
    // that to a falsy origin and returns the public cluster.
    expect(resolveSolanaEndpoint('')).toBe(solanaPublicEndpoint);
  });

  it('keeps the public fallback an absolute URL that Connection can consume', () => {
    expect(() => new URL(solanaPublicEndpoint)).not.toThrow();
  });
});
