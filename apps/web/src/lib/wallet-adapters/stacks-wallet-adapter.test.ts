import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Stub the stacks-connect ACL module. The adapter's contract is "turn a Stacks
// session into a STX + BTC account pair and forward connect/disconnect" — the
// one source that yields two accounts from a single connection.
const mocks = vi.hoisted(() => ({
  connectStacksWallet: vi.fn(),
  disconnectStacksWallet: vi.fn(),
  readStacksAddresses: vi.fn(),
}));

vi.mock('@/lib/stacks-connect', () => mocks);

import { createStacksWalletAdapter } from './stacks-wallet-adapter';

describe('createStacksWalletAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readStacksAddresses.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('declares the stacks source over the stx and btc chains', () => {
    const adapter = createStacksWalletAdapter();
    expect(adapter.id).toBe('stacks');
    expect(adapter.chains).toEqual(['stx', 'btc']);
  });

  it('maps a session to a STX and a BTC account', () => {
    mocks.readStacksAddresses.mockReturnValue({ stx: 'SP123', btc: 'bc1qx' });
    const adapter = createStacksWalletAdapter();
    expect(adapter.getAccounts()).toEqual([
      { chain: 'stx', address: 'SP123' },
      { chain: 'btc', address: 'bc1qx' },
    ]);
  });

  it('reports no accounts without a session', () => {
    mocks.readStacksAddresses.mockReturnValue(null);
    const adapter = createStacksWalletAdapter();
    expect(adapter.getAccounts()).toEqual([]);
  });

  it('forwards connect/disconnect to stacks-connect', async () => {
    const adapter = createStacksWalletAdapter();
    await adapter.connect();
    expect(mocks.connectStacksWallet).toHaveBeenCalledOnce();
    await adapter.disconnect();
    expect(mocks.disconnectStacksWallet).toHaveBeenCalledOnce();
  });

  it('re-reads accounts on a cross-tab storage event', () => {
    const adapter = createStacksWalletAdapter();
    const received: unknown[] = [];
    const unsubscribe = adapter.onAccountsChanged(accounts => received.push(accounts));

    mocks.readStacksAddresses.mockReturnValue({ stx: 'SP999', btc: 'bc1qy' });
    window.dispatchEvent(new StorageEvent('storage'));

    expect(received).toEqual([
      [
        { chain: 'stx', address: 'SP999' },
        { chain: 'btc', address: 'bc1qy' },
      ],
    ]);

    unsubscribe();
    window.dispatchEvent(new StorageEvent('storage'));
    expect(received).toHaveLength(1);
  });
});
