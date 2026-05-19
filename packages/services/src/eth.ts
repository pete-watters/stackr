import type { Balance } from '@stackr/models';
import { chainMeta } from '@stackr/models';

const ETHERSCAN_API = 'https://api.etherscan.io/api';

interface EtherscanBalanceResponse {
  status: string;
  message: string;
  result: string;
}

export async function fetchEthBalance(address: string, apiKey?: string): Promise<Balance> {
  const params = new URLSearchParams({
    module: 'account',
    action: 'balance',
    address,
    tag: 'latest',
  });

  if (apiKey) {
    params.set('apikey', apiKey);
  }

  const res = await fetch(`${ETHERSCAN_API}?${params}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch ETH balance: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as EtherscanBalanceResponse;

  if (data.status !== '1') {
    throw new Error(`Etherscan API error: ${data.message}`);
  }

  const { decimals } = chainMeta.eth;
  const rawBalance = data.result;
  const balance = (Number(BigInt(rawBalance)) / 10 ** decimals).toFixed(decimals);

  return {
    chain: 'eth',
    address,
    rawBalance,
    balance,
    updatedAt: new Date().toISOString(),
  };
}
