import { describe, expect, it, vi } from 'vitest';
import { createSolanaWalletAdapter, type SolanaWalletSource } from './solana-wallet-adapter';

/**
 * A stub Solana wallet that satisfies {@link SolanaWalletSource} with a plain
 * object — no `@solana/*` SDK, no DOM. `fire` simulates the adapter emitting an
 * event the way Phantom does when it connects or disconnects.
 */
function createStubWallet(base58 = 'SoLaNa1111') {
  const listeners: Record<'connect' | 'disconnect', Array<() => void>> = {
    connect: [],
    disconnect: [],
  };
  let key: { toBase58(): string } | null = null;

  const wallet: SolanaWalletSource = {
    get publicKey() {
      return key;
    },
    connect: vi.fn(async () => {
      key = { toBase58: () => base58 };
    }),
    disconnect: vi.fn(async () => {
      key = null;
    }),
    on: (event, listener) => {
      listeners[event].push(listener);
      return wallet;
    },
    off: (event, listener) => {
      listeners[event] = listeners[event].filter(l => l !== listener);
      return wallet;
    },
  };

  return {
    wallet,
    setKey: (value: { toBase58(): string } | null) => {
      key = value;
    },
    fire: (event: 'connect' | 'disconnect') => listeners[event].forEach(l => l()),
    listenerCount: (event: 'connect' | 'disconnect') => listeners[event].length,
  };
}

describe('createSolanaWalletAdapter', () => {
  it('declares the solana source over the sol chain', () => {
    const { wallet } = createStubWallet();
    const adapter = createSolanaWalletAdapter(wallet);
    expect(adapter.id).toBe('solana');
    expect(adapter.chains).toEqual(['sol']);
  });

  it('maps the public key to a base58 WalletAccount', () => {
    const stub = createStubWallet('PhantomKey99');
    stub.setKey({ toBase58: () => 'PhantomKey99' });
    const adapter = createSolanaWalletAdapter(stub.wallet);
    expect(adapter.getAccounts()).toEqual([{ chain: 'sol', address: 'PhantomKey99' }]);
  });

  it('reports no accounts when the wallet has no public key', () => {
    const { wallet } = createStubWallet();
    const adapter = createSolanaWalletAdapter(wallet);
    expect(adapter.getAccounts()).toEqual([]);
  });

  it('forwards connect/disconnect to the wallet', async () => {
    const { wallet } = createStubWallet();
    const adapter = createSolanaWalletAdapter(wallet);
    await adapter.connect();
    expect(wallet.connect).toHaveBeenCalledOnce();
    await adapter.disconnect();
    expect(wallet.disconnect).toHaveBeenCalledOnce();
  });

  it('emits the current account on connect and an empty list on disconnect', () => {
    const stub = createStubWallet();
    const adapter = createSolanaWalletAdapter(stub.wallet);
    const received: unknown[] = [];
    adapter.onAccountsChanged(accounts => received.push(accounts));

    stub.setKey({ toBase58: () => 'SoLaNa1111' });
    stub.fire('connect');
    stub.setKey(null);
    stub.fire('disconnect');

    expect(received).toEqual([[{ chain: 'sol', address: 'SoLaNa1111' }], []]);
  });

  it('removes its listeners on unsubscribe', () => {
    const stub = createStubWallet();
    const adapter = createSolanaWalletAdapter(stub.wallet);

    const unsubscribe = adapter.onAccountsChanged(() => {});
    expect(stub.listenerCount('connect')).toBe(1);
    expect(stub.listenerCount('disconnect')).toBe(1);

    unsubscribe();
    expect(stub.listenerCount('connect')).toBe(0);
    expect(stub.listenerCount('disconnect')).toBe(0);
  });
});
