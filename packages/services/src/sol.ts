import { z } from 'zod';
import type { Balance } from '@stackr/models';
import { BalanceSchema, chainMeta } from '@stackr/models';
import type { BalanceAdapter } from './ports.js';
import { parseOrThrow } from './validate.js';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

/**
 * Ingress schema for a Solana `getBalance` JSON-RPC response. The lamport
 * balance lives at `result.value`.
 */
const SolanaBalanceSchema = z.object({
  result: z.object({
    value: z.number(),
  }),
});

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

  // Ingress boundary: validate the JSON-RPC result before reading lamports.
  const data = parseOrThrow(SolanaBalanceSchema, await res.json(), 'sol.fetchBalance(ingress)');

  const lamports = data.result.value;
  const { decimals } = chainMeta.sol;
  const balance = (lamports / 10 ** decimals).toFixed(decimals);

  // Egress boundary: guarantee a valid domain `Balance` leaves the adapter.
  return parseOrThrow(
    BalanceSchema,
    {
      chain: 'sol',
      address,
      rawBalance: lamports.toString(),
      balance,
      updatedAt: new Date().toISOString(),
    },
    'sol.fetchBalance(egress)',
  );
}

/** Public-RPC-backed implementation of the SOL balance port. */
export const solBalanceAdapter: BalanceAdapter = {
  chain: 'sol',
  fetchBalance: address => fetchSolBalance(address),
};
