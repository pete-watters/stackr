import { z } from 'zod';
import type { Balance } from '@stackr/models';
import { BalanceSchema, chainMeta } from '@stackr/models';
import type { BalanceAdapter } from './ports.js';
import { parseOrThrow } from './validate.js';
import { formatBaseUnits } from './base-units.js';

const BLOCKSTREAM_API = 'https://blockstream.info/api';

/**
 * Ingress schema for Blockstream's address endpoint. Kept private to this
 * module — this vendor shape must never escape the adapter. We model only the
 * fields we consume; Blockstream returns more.
 */
const BlockstreamAddressSchema = z.object({
  chain_stats: z.object({
    funded_txo_sum: z.number(),
    spent_txo_sum: z.number(),
  }),
  mempool_stats: z.object({
    funded_txo_sum: z.number(),
    spent_txo_sum: z.number(),
  }),
});

export async function fetchBtcBalance(address: string): Promise<Balance> {
  const res = await fetch(`${BLOCKSTREAM_API}/address/${encodeURIComponent(address)}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch BTC balance: ${res.status} ${res.statusText}`);
  }

  // Ingress boundary: validate Blockstream's payload before we read from it.
  const data = parseOrThrow(
    BlockstreamAddressSchema,
    await res.json(),
    'btc.fetchBalance(ingress)',
  );

  const confirmedBalance = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
  const mempoolBalance = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;
  const totalSatoshis = confirmedBalance + mempoolBalance;

  const { decimals } = chainMeta.btc;
  const balance = formatBaseUnits(totalSatoshis, decimals);

  // Egress boundary: guarantee a valid domain `Balance` leaves the adapter.
  return parseOrThrow(
    BalanceSchema,
    {
      chain: 'btc',
      address,
      rawBalance: totalSatoshis.toString(),
      balance,
      updatedAt: new Date().toISOString(),
    },
    'btc.fetchBalance(egress)',
  );
}

/** Blockstream-backed implementation of the BTC balance port. */
export const btcBalanceAdapter: BalanceAdapter = {
  chain: 'btc',
  fetchBalance: address => fetchBtcBalance(address),
};
