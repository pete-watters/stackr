import { clusterApiUrl } from '@solana/web3.js';

const heliusKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

export const solanaEndpoint = heliusKey
  ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
  : clusterApiUrl('mainnet-beta');
