import type { Balance } from '@stackr/models';
import { chainMeta } from '@stackr/models';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

interface SolanaRpcResponse {
  jsonrpc: string;
  id: number;
  result: {
    context: { slot: number };
    value: number;
  };
}

export async function fetchSolBalance(address: string): Promise<Balance> {
  const res = await fetch(SOLANA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address],
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch SOL balance: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as SolanaRpcResponse;

  const lamports = data.result.value;
  const { decimals } = chainMeta.sol;
  const balance = (lamports / 10 ** decimals).toFixed(decimals);

  return {
    chain: 'sol',
    address,
    rawBalance: lamports.toString(),
    balance,
    updatedAt: new Date().toISOString(),
  };
}
