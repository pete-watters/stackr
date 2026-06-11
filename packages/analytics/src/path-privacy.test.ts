import { describe, expect, it } from 'vitest';
import { sanitizePathname } from './path-privacy';

describe('sanitizePathname', () => {
  it('masks an EVM address in the wallet route', () => {
    expect(sanitizePathname('/wallet/eth/0x71C7656EC7ab88b098defB751B7401B5f6d8976F')).toBe(
      '/wallet/eth/:address',
    );
  });

  it('masks a Bitcoin bech32 address', () => {
    expect(sanitizePathname('/wallet/btc/bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).toBe(
      '/wallet/btc/:address',
    );
  });

  it('masks a Bitcoin legacy address', () => {
    expect(sanitizePathname('/wallet/btc/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(
      '/wallet/btc/:address',
    );
  });

  it('masks a Solana address', () => {
    expect(sanitizePathname('/wallet/sol/4Nd1mYvK7QzXhBuRWnu7Lk8YkQYsHvTkXfDQxFeqnEjV')).toBe(
      '/wallet/sol/:address',
    );
  });

  it('masks a Stacks address', () => {
    expect(sanitizePathname('/wallet/stx/SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7')).toBe(
      '/wallet/stx/:address',
    );
  });

  it('masks bare 32-byte hex (covers future SUI routes)', () => {
    const sui = '0x2d1c8a3f4e5b6a7980c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3';
    expect(sanitizePathname(`/wallet/sui/${sui}`)).toBe('/wallet/sui/:address');
  });

  it('masks unknown long opaque segments as a safety net', () => {
    expect(sanitizePathname('/share/abcdefghijklmnopqrstuvwxyz0123456789')).toBe('/share/:param');
  });

  it('leaves static routes untouched', () => {
    expect(sanitizePathname('/')).toBe('/');
    expect(sanitizePathname('/charts')).toBe('/charts');
    expect(sanitizePathname('/holdings/add')).toBe('/holdings/add');
    expect(sanitizePathname('/wallet/view')).toBe('/wallet/view');
    expect(sanitizePathname('/settings')).toBe('/settings');
  });

  it('keeps the chain slug while masking only the address', () => {
    const out = sanitizePathname('/wallet/eth/0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
    expect(out).toContain('/eth/');
    expect(out).not.toContain('0x');
  });
});
