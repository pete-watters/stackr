'use client';

import { useEffect, useState } from 'react';
import { Button } from '@stackr/ui';
import { useWalletStore } from '@/lib/wallet-store';
import {
  connectStacksWallet,
  disconnectStacksWallet,
  isStacksWalletConnected,
  readStacksAddresses,
} from '@/lib/stacks-connect';

const STX_DISPLAY_PREFIX = 4;
const STX_DISPLAY_SUFFIX = 4;

function truncate(addr: string) {
  if (addr.length <= STX_DISPLAY_PREFIX + STX_DISPLAY_SUFFIX + 1) return addr;
  return `${addr.slice(0, STX_DISPLAY_PREFIX)}…${addr.slice(-STX_DISPLAY_SUFFIX)}`;
}

export function LeatherConnectButton() {
  const setConnectedAddresses = useWalletStore(s => s.setConnectedAddresses);
  const clearConnectedAddresses = useWalletStore(s => s.clearConnectedAddresses);
  const stxAddresses = useWalletStore(s => s.connectedAddresses.stx);
  const [busy, setBusy] = useState(false);

  // Reconnect-after-refresh: on mount, if a session is already persisted by
  // @stacks/connect, mirror it into our store so the portfolio view picks it up.
  useEffect(() => {
    if (!isStacksWalletConnected()) return;
    const addrs = readStacksAddresses();
    if (!addrs) return;
    setConnectedAddresses('stx', [addrs.stx]);
    setConnectedAddresses('btc', [addrs.btc]);
  }, [setConnectedAddresses]);

  const connected = (stxAddresses?.length ?? 0) > 0;
  const label = connected && stxAddresses ? truncate(stxAddresses[0]) : 'Connect Leather';

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      if (connected) {
        disconnectStacksWallet();
        clearConnectedAddresses('stx');
        clearConnectedAddresses('btc');
        return;
      }
      const addrs = await connectStacksWallet();
      if (!addrs) return;
      setConnectedAddresses('stx', [addrs.stx]);
      setConnectedAddresses('btc', [addrs.btc]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={connected ? 'outline' : 'primary'} size="sm" onClick={handleClick}>
      {label}
    </Button>
  );
}
