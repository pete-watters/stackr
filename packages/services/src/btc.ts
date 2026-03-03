import type { Balance } from '@stackr/models';
import { chainMeta } from '@stackr/models';

const BLOCKSTREAM_API = 'https://blockstream.info/api';

interface BlockstreamAddressResponse {
  address: string;
  chain_stats: {
    funded_txo_sum: number;
    spent_txo_sum: number;
  };
  mempool_stats: {
    funded_txo_sum: number;
    spent_txo_sum: number;
  };
}

export async function fetchBtcBalance(address: string): Promise<Balance> {
  const res = await fetch(`${BLOCKSTREAM_API}/address/${address}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch BTC balance: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as BlockstreamAddressResponse;

  const confirmedBalance = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
  const mempoolBalance = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;
  const totalSatoshis = confirmedBalance + mempoolBalance;

  const { decimals } = chainMeta.btc;
  const balance = (totalSatoshis / 10 ** decimals).toFixed(decimals);

  return {
    chain: 'btc',
    address,
    rawBalance: totalSatoshis.toString(),
    balance,
    updatedAt: new Date().toISOString(),
  };
}
