import type { Chain } from '@stackr/models';

type ExplorerType = 'tx' | 'address' | 'block';

const explorerUrls: Record<Chain, string> = {
  btc: 'https://blockstream.info',
  eth: 'https://etherscan.io',
  stx: 'https://explorer.hiro.so',
  sol: 'https://solscan.io',
  sui: 'https://suiscan.xyz/mainnet',
};

const pathPatterns: Record<Chain, Record<ExplorerType, string>> = {
  btc: { tx: '/tx/', address: '/address/', block: '/block/' },
  eth: { tx: '/tx/', address: '/address/', block: '/block/' },
  stx: { tx: '/txid/', address: '/address/', block: '/block/' },
  sol: { tx: '/tx/', address: '/account/', block: '/block/' },
  sui: { tx: '/tx/', address: '/account/', block: '/checkpoint/' },
};

export function getExplorerUrl(chain: Chain, type: ExplorerType, hash: string): string {
  return `${explorerUrls[chain]}${pathPatterns[chain][type]}${hash}`;
}
