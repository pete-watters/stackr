import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';
import { mainnet } from 'wagmi/chains';
import { http } from 'wagmi';

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

export const wagmiConfig = getDefaultConfig({
  appName: 'Stackr',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
  chains: [mainnet],
  transports: {
    [mainnet.id]: alchemyKey ? http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`) : http(),
  },
  wallets: [{ groupName: 'Recommended', wallets: [metaMaskWallet] }],
  ssr: true,
});
