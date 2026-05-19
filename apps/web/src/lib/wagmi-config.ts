import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';
import { mainnet } from 'wagmi/chains';
import { http } from 'wagmi';

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

// RainbowKit's getDefaultConfig requires a non-empty projectId even when the
// wallet list excludes WalletConnect — set a placeholder so SSR prerender
// doesn't crash when the env var is missing. Replace with a real Cloud
// projectId from https://cloud.reown.com when WalletConnect is reintroduced.
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'stackr-dev';

export const wagmiConfig = getDefaultConfig({
  appName: 'Stackr',
  projectId,
  chains: [mainnet],
  transports: {
    [mainnet.id]: alchemyKey ? http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`) : http(),
  },
  wallets: [{ groupName: 'Recommended', wallets: [metaMaskWallet] }],
  ssr: true,
});
