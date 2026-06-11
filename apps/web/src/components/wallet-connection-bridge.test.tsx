import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useWalletStore } from '@/lib/wallet-store';
import { WalletConnectionBridge } from './wallet-connection-bridge';

/**
 * The bridge replaces the two `*-address-sync` components, so its guarantee is
 * the additive one: it keeps `wallet-store.connectedAddresses` in step with the
 * WalletConnectionController. On mount with nothing connected it should clear
 * the chains it owns — the same thing the old components did via `useEffect`.
 */
describe('WalletConnectionBridge', () => {
  afterEach(() => {
    cleanup();
    useWalletStore.getState().clearConnectedAddresses('eth');
    useWalletStore.getState().clearConnectedAddresses('sol');
  });

  it('clears the bridged chains on mount when nothing is connected', () => {
    useWalletStore.getState().setConnectedAddresses('eth', ['0xstale']);
    useWalletStore.getState().setConnectedAddresses('sol', ['SoLstale']);

    render(<WalletConnectionBridge />);

    expect(useWalletStore.getState().connectedAddresses.eth).toBeUndefined();
    expect(useWalletStore.getState().connectedAddresses.sol).toBeUndefined();
  });

  it('leaves non-bridged chains (stx/btc) untouched', () => {
    useWalletStore.getState().setConnectedAddresses('stx', ['SP123']);

    render(<WalletConnectionBridge />);

    expect(useWalletStore.getState().connectedAddresses.stx).toEqual(['SP123']);
    useWalletStore.getState().clearConnectedAddresses('stx');
  });
});
