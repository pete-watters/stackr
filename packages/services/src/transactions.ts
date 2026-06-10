import { z } from 'zod';
import type { Chain, Transaction } from '@stackr/models';
import { TransactionSchema } from '@stackr/models';
import type { TransactionAdapter } from './ports.js';
import { parseOrThrow } from './validate.js';

const TransactionListSchema = z.array(TransactionSchema);

export async function fetchTransactions(chain: Chain, address: string): Promise<Transaction[]> {
  switch (chain) {
    case 'btc':
      return fetchBtcTransactions(address);
    case 'eth':
      return fetchEthTransactions(address);
    case 'stx':
      return fetchStxTransactions(address);
    case 'sol':
      return fetchSolTransactions(address);
  }
}

// ---------------------------------------------------------------------------
// BTC — Blockstream address/txs
// ---------------------------------------------------------------------------

const BlockstreamTxSchema = z.object({
  txid: z.string(),
  vout: z.array(
    z.object({
      scriptpubkey_address: z.string().optional(),
      value: z.number().optional(),
    }),
  ),
  vin: z.array(
    z.object({
      prevout: z.object({ scriptpubkey_address: z.string().optional() }).nullable().optional(),
    }),
  ),
  status: z
    .object({
      confirmed: z.boolean().optional(),
      block_time: z.number().optional(),
    })
    .optional(),
});

const BlockstreamTxListSchema = z.array(BlockstreamTxSchema);

type BlockstreamTx = z.infer<typeof BlockstreamTxSchema>;

/**
 * Normalize Blockstream txs into domain `Transaction`s. Bitcoin has no
 * "from/to" — direction is inferred from whether any output pays the watched
 * address, and the amount is the sum of the relevant outputs. Pure (no
 * network) so the UTXO direction logic is unit-testable.
 */
export function normalizeBtcTransactions(txs: BlockstreamTx[], address: string): Transaction[] {
  const normalized = txs.slice(0, 20).map(tx => {
    const isReceive = tx.vout.some(o => o.scriptpubkey_address === address);

    const amount = tx.vout
      .filter(o =>
        isReceive ? o.scriptpubkey_address === address : o.scriptpubkey_address !== address,
      )
      .reduce((sum, o) => sum + (o.value ?? 0), 0);

    const counterparty = isReceive
      ? (tx.vin[0]?.prevout?.scriptpubkey_address ?? 'unknown')
      : (tx.vout.find(o => o.scriptpubkey_address !== address)?.scriptpubkey_address ?? 'unknown');

    return {
      hash: tx.txid,
      chain: 'btc' as const,
      type: isReceive ? ('receive' as const) : ('send' as const),
      amount: (amount / 1e8).toFixed(8),
      counterparty,
      timestamp: tx.status?.block_time
        ? new Date(tx.status.block_time * 1000).toISOString()
        : new Date().toISOString(),
      confirmed: tx.status?.confirmed ?? false,
    };
  });

  return parseOrThrow(TransactionListSchema, normalized, 'btc.fetchTransactions(egress)');
}

async function fetchBtcTransactions(address: string): Promise<Transaction[]> {
  const res = await fetch(`https://blockstream.info/api/address/${address}/txs`);
  if (!res.ok) throw new Error(`Blockstream API error: ${res.status}`);

  const data = parseOrThrow(
    BlockstreamTxListSchema,
    await res.json(),
    'btc.fetchTransactions(ingress)',
  );
  return normalizeBtcTransactions(data, address);
}

// ---------------------------------------------------------------------------
// ETH — Etherscan txlist
// ---------------------------------------------------------------------------

const EtherscanTxSchema = z.object({
  hash: z.string(),
  from: z.string().optional(),
  to: z.string().optional(),
  value: z.string().optional(),
  timeStamp: z.string().optional(),
  txreceipt_status: z.string().optional(),
});

/**
 * Etherscan signals "no transactions" / rate limits via `status: '0'` with a
 * string `result` message, and success via `status: '1'` with an array. The
 * union captures both so ingress validation doesn't reject the empty case.
 */
const EtherscanTxListSchema = z.object({
  status: z.string(),
  result: z.union([z.array(EtherscanTxSchema), z.string()]),
});

type EtherscanTx = z.infer<typeof EtherscanTxSchema>;

/** Normalize Etherscan txs into domain `Transaction`s. */
export function normalizeEthTransactions(txs: EtherscanTx[], address: string): Transaction[] {
  const lower = address.toLowerCase();
  const normalized = txs.map(tx => {
    const isReceive = tx.to?.toLowerCase() === lower;
    return {
      hash: tx.hash,
      chain: 'eth' as const,
      type: isReceive ? ('receive' as const) : ('send' as const),
      amount: (parseInt(tx.value ?? '0') / 1e18).toFixed(8),
      counterparty: (isReceive ? tx.from : tx.to) ?? 'unknown',
      timestamp: new Date(parseInt(tx.timeStamp ?? '0') * 1000).toISOString(),
      confirmed: tx.txreceipt_status === '1',
    };
  });

  return parseOrThrow(TransactionListSchema, normalized, 'eth.fetchTransactions(egress)');
}

async function fetchEthTransactions(address: string, apiKey?: string): Promise<Transaction[]> {
  const keyParam = apiKey ? `&apikey=${apiKey}` : '';
  const res = await fetch(
    `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&page=1&offset=20${keyParam}`,
  );
  if (!res.ok) throw new Error(`Etherscan API error: ${res.status}`);

  const data = parseOrThrow(
    EtherscanTxListSchema,
    await res.json(),
    'eth.fetchTransactions(ingress)',
  );
  if (data.status !== '1' || !Array.isArray(data.result)) return [];

  return normalizeEthTransactions(data.result, address);
}

// ---------------------------------------------------------------------------
// STX — Hiro address/transactions
// ---------------------------------------------------------------------------

const HiroTxSchema = z.object({
  tx_id: z.string(),
  tx_type: z.string(),
  tx_status: z.string().optional(),
  sender_address: z.string().optional(),
  burn_block_time_iso: z.string().optional(),
  token_transfer: z
    .object({
      recipient_address: z.string().optional(),
      amount: z.string().optional(),
    })
    .optional(),
});

const HiroTxListSchema = z.object({
  results: z.array(HiroTxSchema),
});

type HiroTx = z.infer<typeof HiroTxSchema>;

/**
 * Normalize Hiro txs into domain `Transaction`s, keeping only STX
 * `token_transfer`s (contract calls and coinbases are out of scope for the
 * activity feed).
 */
export function normalizeStxTransactions(txs: HiroTx[], address: string): Transaction[] {
  const normalized = txs
    .filter(tx => tx.tx_type === 'token_transfer')
    .map(tx => {
      const isReceive = tx.token_transfer?.recipient_address === address;
      return {
        hash: tx.tx_id,
        chain: 'stx' as const,
        type: isReceive ? ('receive' as const) : ('send' as const),
        amount: (parseInt(tx.token_transfer?.amount ?? '0') / 1e6).toFixed(6),
        counterparty: isReceive
          ? (tx.sender_address ?? 'unknown')
          : (tx.token_transfer?.recipient_address ?? 'unknown'),
        timestamp: tx.burn_block_time_iso ?? new Date().toISOString(),
        confirmed: tx.tx_status === 'success',
      };
    });

  return parseOrThrow(TransactionListSchema, normalized, 'stx.fetchTransactions(egress)');
}

async function fetchStxTransactions(address: string): Promise<Transaction[]> {
  const res = await fetch(
    `https://api.hiro.so/extended/v1/address/${address}/transactions?limit=20`,
  );
  if (!res.ok) throw new Error(`Hiro API error: ${res.status}`);

  const data = parseOrThrow(HiroTxListSchema, await res.json(), 'stx.fetchTransactions(ingress)');
  return normalizeStxTransactions(data.results, address);
}

// ---------------------------------------------------------------------------
// SOL — getSignaturesForAddress
// ---------------------------------------------------------------------------

const SolanaSignatureSchema = z.object({
  signature: z.string(),
  blockTime: z.number().nullable().optional(),
  err: z.unknown(),
});

const SolanaSignaturesSchema = z.object({
  result: z.array(SolanaSignatureSchema).nullable().optional(),
});

type SolanaSignature = z.infer<typeof SolanaSignatureSchema>;

/**
 * Normalize Solana signatures into domain `Transaction`s. Signatures alone
 * don't carry direction or amount (that needs a `getTransaction` per sig), so
 * those are placeholdered — direction defaults to `receive` and amount to `0`.
 */
export function normalizeSolTransactions(signatures: SolanaSignature[]): Transaction[] {
  const normalized = signatures.map(sig => ({
    hash: sig.signature,
    chain: 'sol' as const,
    type: 'receive' as const,
    amount: '0',
    counterparty: 'unknown',
    timestamp: sig.blockTime
      ? new Date(sig.blockTime * 1000).toISOString()
      : new Date().toISOString(),
    confirmed: sig.err === null,
  }));

  return parseOrThrow(TransactionListSchema, normalized, 'sol.fetchTransactions(egress)');
}

async function fetchSolTransactions(address: string): Promise<Transaction[]> {
  const sigRes = await fetch('https://api.mainnet-beta.solana.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getSignaturesForAddress',
      params: [address, { limit: 20 }],
    }),
  });

  if (!sigRes.ok) throw new Error(`Solana RPC error: ${sigRes.status}`);

  const data = parseOrThrow(
    SolanaSignaturesSchema,
    await sigRes.json(),
    'sol.fetchTransactions(ingress)',
  );
  return normalizeSolTransactions(data.result ?? []);
}

/** Multi-chain implementation of the transaction port. */
export const transactionAdapter: TransactionAdapter = {
  fetchTransactions,
};
