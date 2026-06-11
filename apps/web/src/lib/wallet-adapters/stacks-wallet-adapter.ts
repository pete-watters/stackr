import type { WalletAccount, WalletSourceAdapter } from '@stackr/controllers';
import {
  connectStacksWallet,
  disconnectStacksWallet,
  readStacksAddresses,
} from '@/lib/stacks-connect';

/**
 * Stacks wallet source — wraps `stacks-connect`. This is the case that makes
 * the inverted topology concrete (ADR 0015): one connected source yields TWO
 * accounts, a STX address and a BTC address, from a single session. The
 * `@stacks/connect` API and its localStorage session stay inside this module.
 *
 * Unlike wagmi and wallet-adapter, `@stacks/connect` exposes no event emitter,
 * so `onAccountsChanged` listens for cross-tab `storage` events; same-tab
 * changes are captured by the controller reading `getAccounts()` after its
 * `connect()`/`disconnect()` action settles.
 */
export function createStacksWalletAdapter(): WalletSourceAdapter {
  function read(): WalletAccount[] {
    const addresses = readStacksAddresses();
    if (!addresses) {
      return [];
    }
    return [
      { chain: 'stx', address: addresses.stx },
      { chain: 'btc', address: addresses.btc },
    ];
  }

  return {
    id: 'stacks',
    chains: ['stx', 'btc'],
    async connect() {
      await connectStacksWallet();
    },
    async disconnect() {
      disconnectStacksWallet();
    },
    getAccounts: read,
    onAccountsChanged(callback) {
      if (typeof window === 'undefined') {
        return () => {};
      }
      const handler = () => callback(read());
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  };
}
