'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWalletStore } from '@/lib/wallet-store';

export function ConnectedAddressSync() {
  const { address, isConnected } = useAccount();
  const setConnectedAddresses = useWalletStore(s => s.setConnectedAddresses);
  const clearConnectedAddresses = useWalletStore(s => s.clearConnectedAddresses);

  useEffect(() => {
    if (isConnected && address) {
      setConnectedAddresses('eth', [address]);
    } else {
      clearConnectedAddresses('eth');
    }
  }, [address, isConnected, setConnectedAddresses, clearConnectedAddresses]);

  return null;
}
