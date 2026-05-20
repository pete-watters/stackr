'use client';

import { ChainAvatar, Tooltip, TooltipTrigger, TooltipContent } from '@stackr/ui';
import { chainMeta, type Chain } from '@stackr/models';
import { useWalletStore } from '@/lib/wallet-store';
import { useIsNativePlatform } from '@/lib/use-is-native-platform';

const CHAINS: Chain[] = ['eth', 'sol', 'stx', 'btc'];

/**
 * A row of per-chain dots in the header. A chain is "lit" (full opacity) when
 * an address is connected for it, dimmed otherwise. Connected state is read
 * from the wallet store, which the wallet sync layer keeps current.
 */
export function ChainStatusIndicators() {
  const connectedAddresses = useWalletStore(s => s.connectedAddresses);
  const isNative = useIsNativePlatform();

  // Connection status is meaningless on the watch-only mobile build.
  if (isNative) return null;

  return (
    <div className="flex items-center gap-1" aria-label="Connected chains">
      {CHAINS.map(chain => {
        const connected = (connectedAddresses[chain]?.length ?? 0) > 0;
        return (
          <Tooltip key={chain}>
            <TooltipTrigger asChild>
              <span className={connected ? 'opacity-100' : 'opacity-30'}>
                <ChainAvatar chain={chain} size="sm" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {chainMeta[chain].name}: {connected ? 'connected' : 'not connected'}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
