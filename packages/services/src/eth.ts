import { z } from 'zod';
import type { Balance } from '@stackr/models';
import { BalanceSchema, chainMeta } from '@stackr/models';
import type { BalanceAdapter, BalanceAdapterOptions } from './ports.js';
import { parseOrThrow } from './validate.js';

const ETHERSCAN_API = 'https://api.etherscan.io/api';

/**
 * Ingress schema for Etherscan's `account.balance` response. Etherscan wraps
 * every result in a `status`/`message`/`result` envelope and signals failure
 * via `status === '0'` (HTTP is still 200), so the envelope itself is the only
 * reliable success signal.
 */
const EtherscanBalanceSchema = z.object({
  status: z.string(),
  message: z.string(),
  result: z.string(),
});

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

  // Ingress boundary: validate the envelope, then check the in-band status.
  const data = parseOrThrow(EtherscanBalanceSchema, await res.json(), 'eth.fetchBalance(ingress)');

  if (data.status !== '1') {
    throw new Error(`Etherscan API error: ${data.message}`);
  }

  const { decimals } = chainMeta.eth;
  const rawBalance = data.result;
  const balance = (Number(BigInt(rawBalance)) / 10 ** decimals).toFixed(decimals);

  // Egress boundary: guarantee a valid domain `Balance` leaves the adapter.
  return parseOrThrow(
    BalanceSchema,
    {
      chain: 'eth',
      address,
      rawBalance,
      balance,
      updatedAt: new Date().toISOString(),
    },
    'eth.fetchBalance(egress)',
  );
}

/**
 * Etherscan-backed implementation of the ETH balance port. This is the one
 * chain that consumes `options.apiKey` (the user's own Etherscan key, passed
 * down from the settings store).
 */
export const ethBalanceAdapter: BalanceAdapter = {
  chain: 'eth',
  fetchBalance: (address, options?: BalanceAdapterOptions) =>
    fetchEthBalance(address, options?.apiKey),
};
