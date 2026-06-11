import { beforeEach, describe, expect, it, vi } from 'vitest';
import { wagmiConfig } from '@/lib/wagmi-config';

// Stub wagmi's imperative core. The adapter's contract is "map wagmi account
// state to WalletAccounts and forward connect/disconnect/watch" — we assert
// exactly that, with no real wallet or network.
const mocks = vi.hoisted(() => ({
  getAccount: vi.fn(),
  watchAccount: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  getConnectors: vi.fn(),
}));

vi.mock('wagmi/actions', () => mocks);

import { createEvmWalletAdapter } from './evm-wallet-adapter';

describe('createEvmWalletAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAccount.mockReturnValue({ address: undefined });
    mocks.getConnectors.mockReturnValue([]);
    mocks.watchAccount.mockReturnValue(() => {});
  });

  it('declares the evm source over the eth chain', () => {
    const adapter = createEvmWalletAdapter(wagmiConfig);
    expect(adapter.id).toBe('evm');
    expect(adapter.chains).toEqual(['eth']);
  });

  it('maps a connected wagmi account to a WalletAccount', () => {
    mocks.getAccount.mockReturnValue({ address: '0xabc' });
    const adapter = createEvmWalletAdapter(wagmiConfig);
    expect(adapter.getAccounts()).toEqual([{ chain: 'eth', address: '0xabc' }]);
  });

  it('reports no accounts when wagmi is disconnected', () => {
    mocks.getAccount.mockReturnValue({ address: undefined });
    const adapter = createEvmWalletAdapter(wagmiConfig);
    expect(adapter.getAccounts()).toEqual([]);
  });

  it('connects with the first configured connector', async () => {
    const connector = { id: 'metaMask' };
    mocks.getConnectors.mockReturnValue([connector]);
    const adapter = createEvmWalletAdapter(wagmiConfig);

    await adapter.connect();

    expect(mocks.connect).toHaveBeenCalledWith(wagmiConfig, { connector });
  });

  it('does nothing on connect when no connector is available', async () => {
    mocks.getConnectors.mockReturnValue([]);
    const adapter = createEvmWalletAdapter(wagmiConfig);

    await adapter.connect();

    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it('forwards disconnect to wagmi', async () => {
    const adapter = createEvmWalletAdapter(wagmiConfig);
    await adapter.disconnect();
    expect(mocks.disconnect).toHaveBeenCalledWith(wagmiConfig);
  });

  it('emits mapped accounts when wagmi reports a change', () => {
    const adapter = createEvmWalletAdapter(wagmiConfig);
    const received: unknown[] = [];

    adapter.onAccountsChanged(accounts => received.push(accounts));

    // The adapter wires watchAccount's onChange; fire it with a now-connected
    // account and assert the mapped result reached our callback.
    const { onChange } = mocks.watchAccount.mock.calls[0][1];
    mocks.getAccount.mockReturnValue({ address: '0xdef' });
    onChange();

    expect(received).toEqual([[{ chain: 'eth', address: '0xdef' }]]);
  });

  it('returns watchAccount unsubscribe handle from onAccountsChanged', () => {
    const unwatch = vi.fn();
    mocks.watchAccount.mockReturnValue(unwatch);
    const adapter = createEvmWalletAdapter(wagmiConfig);

    const unsubscribe = adapter.onAccountsChanged(() => {});
    unsubscribe();

    expect(unwatch).toHaveBeenCalledOnce();
  });
});
