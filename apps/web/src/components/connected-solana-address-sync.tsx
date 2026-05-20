'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletStore } from '@/lib/wallet-store';

export function ConnectedSolanaAddressSync() {
  const { publicKey, connected } = useWallet();
  const setConnectedAddresses = useWalletStore(s => s.setConnectedAddresses);
  const clearConnectedAddresses = useWalletStore(s => s.clearConnectedAddresses);

  useEffect(() => {
    if (connected && publicKey) {
      setConnectedAddresses('sol', [publicKey.toBase58()]);
    } else {
      clearConnectedAddresses('sol');
    }
  }, [publicKey, connected, setConnectedAddresses, clearConnectedAddresses]);

  return null;
}
