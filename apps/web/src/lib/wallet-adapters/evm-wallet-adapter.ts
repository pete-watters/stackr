import type { Config } from 'wagmi';
import { connect, disconnect, getAccount, getConnectors, watchAccount } from 'wagmi/actions';
import type { WalletAccount, WalletSourceAdapter } from '@stackr/controllers';

/**
 * EVM wallet source — a thin wrapper over wagmi's imperative core actions.
 *
 * This is one of the three implementations of the {@link WalletSourceAdapter}
 * port. Per ADR 0012's anti-corruption rule, every wagmi/viem type stays inside
 * this module: the controller only ever sees `WalletAccount`s. It replaces
 * `connected-address-sync.tsx`, whose React effect watched `useAccount()` and
 * pushed into the store; `watchAccount` is the non-React equivalent, so the
 * adapter carries no React and can be contract-tested with a stub `Config`.
 */
export function createEvmWalletAdapter(config: Config): WalletSourceAdapter {
  function read(): WalletAccount[] {
    const account = getAccount(config);
    return account.address ? [{ chain: 'eth', address: account.address }] : [];
  }

  return {
    id: 'evm',
    chains: ['eth'],
    async connect() {
      // RainbowKit's modal normally drives connection; this imperative path
      // exists so the controller's `connect` action is honoured too. We use the
      // first configured connector (MetaMask, per wagmi-config).
      const [connector] = getConnectors(config);
      if (!connector) {
        return;
      }
      await connect(config, { connector });
    },
    async disconnect() {
      await disconnect(config);
    },
    getAccounts: read,
    onAccountsChanged(callback) {
      // Guard SSR: `watchAccount` registers a listener on the module-singleton
      // config, which must not happen during a server render (it would leak a
      // subscription per request). On the client the controller is rebuilt and
      // subscribes for real.
      if (typeof window === 'undefined') {
        return () => {};
      }
      return watchAccount(config, { onChange: () => callback(read()) });
    },
  };
}
