'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useConnect, useDisconnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { PhantomWalletName } from '@solana/wallet-adapter-phantom';
import type { Chain } from '@stackr/models';
import { useWalletStore } from '@/lib/wallet-store';
import {
  connectStacksWallet,
  disconnectStacksWallet,
  isStacksWalletConnected,
  readStacksAddresses,
} from '@/lib/stacks-connect';

export type WalletId = 'metamask' | 'phantom' | 'leather';

export interface WalletConnection {
  id: WalletId;
  name: string;
  /** Chains this wallet contributes to the portfolio. */
  chains: Chain[];
  connected: boolean;
  connect: () => void | Promise<void>;
  disconnect: () => void | Promise<void>;
}

/**
 * Single source of truth for connecting/disconnecting the three supported
 * wallets and reading their connected state. The unified connect modal and the
 * header status indicators both consume this — there is no per-wallet button.
 *
 * Connected state is read from `wallet-store.connectedAddresses`, which the
 * ETH/SOL sync components keep in step with wagmi and the Solana adapter.
 * Leather has no adapter-level provider, so this hook owns both writing its
 * addresses into the store and restoring them after a refresh.
 */
export function useWalletConnections(): WalletConnection[] {
  const { connectors, connectAsync } = useConnect();
  const { disconnect: disconnectEvm } = useDisconnect();
  const solana = useWallet();
  const setConnectedAddresses = useWalletStore(s => s.setConnectedAddresses);
  const clearConnectedAddresses = useWalletStore(s => s.clearConnectedAddresses);
  const connectedAddresses = useWalletStore(s => s.connectedAddresses);

  // --- Leather: restore a persisted session on mount ---
  useEffect(() => {
    if (!isStacksWalletConnected()) return;
    const addrs = readStacksAddresses();
    if (!addrs) return;
    setConnectedAddresses('stx', [addrs.stx]);
    setConnectedAddresses('btc', [addrs.btc]);
  }, [setConnectedAddresses]);

  // --- Phantom: connect after the adapter has selected the wallet ---
  const wantPhantomRef = useRef(false);
  const { select, connect: solConnect, wallet: solWallet, connected: solConnected } = solana;
  useEffect(() => {
    if (
      wantPhantomRef.current &&
      solWallet?.adapter.name === PhantomWalletName &&
      !solConnected
    ) {
      wantPhantomRef.current = false;
      void solConnect().catch(() => undefined);
    }
  }, [solWallet, solConnected, solConnect]);

  const connectMetaMask = useCallback(async () => {
    const connector = connectors.find(c => c.name === 'MetaMask') ?? connectors[0];
    if (!connector) return;
    await connectAsync({ connector });
  }, [connectors, connectAsync]);

  const connectPhantom = useCallback(() => {
    if (solWallet?.adapter.name === PhantomWalletName) {
      void solConnect().catch(() => undefined);
    } else {
      wantPhantomRef.current = true;
      select(PhantomWalletName);
    }
  }, [solWallet, solConnect, select]);

  const connectLeather = useCallback(async () => {
    const addrs = await connectStacksWallet();
    if (!addrs) return;
    setConnectedAddresses('stx', [addrs.stx]);
    setConnectedAddresses('btc', [addrs.btc]);
  }, [setConnectedAddresses]);

  const disconnectLeather = useCallback(() => {
    disconnectStacksWallet();
    clearConnectedAddresses('stx');
    clearConnectedAddresses('btc');
  }, [clearConnectedAddresses]);

  const has = (chain: Chain) => (connectedAddresses[chain]?.length ?? 0) > 0;

  return [
    {
      id: 'metamask',
      name: 'MetaMask',
      chains: ['eth'],
      connected: has('eth'),
      connect: connectMetaMask,
      disconnect: () => disconnectEvm(),
    },
    {
      id: 'phantom',
      name: 'Phantom',
      chains: ['sol'],
      connected: has('sol'),
      connect: connectPhantom,
      disconnect: () => solana.disconnect(),
    },
    {
      id: 'leather',
      name: 'Leather',
      chains: ['stx', 'btc'],
      connected: has('stx'),
      connect: connectLeather,
      disconnect: disconnectLeather,
    },
  ];
}
