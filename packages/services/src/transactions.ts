import type { Chain, Transaction } from '@stackr/models';
import { chainMeta } from '@stackr/models';

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

async function fetchBtcTransactions(address: string): Promise<Transaction[]> {
  const res = await fetch(`https://blockstream.info/api/address/${address}/txs`);
  if (!res.ok) throw new Error(`Blockstream API error: ${res.status}`);

  const data = await res.json();
  return (data as Array<Record<string, unknown>>)
    .slice(0, 20)
    .map((tx: Record<string, unknown>) => {
      const vout = tx.vout as Array<{ scriptpubkey_address?: string; value?: number }>;
      const vin = tx.vin as Array<{ prevout?: { scriptpubkey_address?: string } }>;

      const isReceive = vout.some(
        (o: { scriptpubkey_address?: string }) => o.scriptpubkey_address === address,
      );

      const amount = vout
        .filter((o: { scriptpubkey_address?: string }) =>
          isReceive ? o.scriptpubkey_address === address : o.scriptpubkey_address !== address,
        )
        .reduce((sum: number, o: { value?: number }) => sum + (o.value ?? 0), 0);

      const counterparty = isReceive
        ? (vin[0]?.prevout?.scriptpubkey_address ?? 'unknown')
        : (vout.find((o: { scriptpubkey_address?: string }) => o.scriptpubkey_address !== address)
            ?.scriptpubkey_address ?? 'unknown');

      const status = tx.status as { confirmed?: boolean; block_time?: number } | undefined;

      return {
        hash: tx.txid as string,
        chain: 'btc' as const,
        type: isReceive ? 'receive' : 'send',
        amount: (amount / 1e8).toFixed(8),
        counterparty,
        timestamp: status?.block_time
          ? new Date(status.block_time * 1000).toISOString()
          : new Date().toISOString(),
        confirmed: status?.confirmed ?? false,
      };
    });
}

async function fetchEthTransactions(address: string, apiKey?: string): Promise<Transaction[]> {
  const keyParam = apiKey ? `&apikey=${apiKey}` : '';
  const res = await fetch(
    `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&page=1&offset=20${keyParam}`,
  );
  if (!res.ok) throw new Error(`Etherscan API error: ${res.status}`);

  const data = await res.json();
  if (data.status !== '1') return [];

  return (data.result as Array<Record<string, string>>).map(tx => ({
    hash: tx.hash,
    chain: 'eth' as const,
    type: tx.to?.toLowerCase() === address.toLowerCase() ? 'receive' : 'send',
    amount: (parseInt(tx.value) / 1e18).toFixed(8),
    counterparty: tx.to?.toLowerCase() === address.toLowerCase() ? tx.from : tx.to,
    timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
    confirmed: tx.txreceipt_status === '1',
  }));
}

async function fetchStxTransactions(address: string): Promise<Transaction[]> {
  const res = await fetch(
    `https://api.hiro.so/extended/v1/address/${address}/transactions?limit=20`,
  );
  if (!res.ok) throw new Error(`Hiro API error: ${res.status}`);

  const data = await res.json();
  return (data.results as Array<Record<string, unknown>>)
    .filter((tx: Record<string, unknown>) => tx.tx_type === 'token_transfer')
    .map((tx: Record<string, unknown>) => {
      const tokenTransfer = tx.token_transfer as
        | {
            recipient_address?: string;
            amount?: string;
          }
        | undefined;
      const isReceive = tokenTransfer?.recipient_address === address;

      return {
        hash: tx.tx_id as string,
        chain: 'stx' as const,
        type: isReceive ? 'receive' : 'send',
        amount: (parseInt(tokenTransfer?.amount ?? '0') / 1e6).toFixed(6),
        counterparty: isReceive
          ? (tx.sender_address as string)
          : (tokenTransfer?.recipient_address ?? 'unknown'),
        timestamp: (tx.burn_block_time_iso as string) ?? new Date().toISOString(),
        confirmed: tx.tx_status === 'success',
      };
    });
}

async function fetchSolTransactions(address: string): Promise<Transaction[]> {
  // Solana RPC - get recent signatures
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

  const sigData = await sigRes.json();
  const signatures = (sigData.result ?? []) as Array<{
    signature: string;
    blockTime?: number;
    err: unknown;
  }>;

  return signatures.map(sig => ({
    hash: sig.signature,
    chain: 'sol' as const,
    type: 'receive' as const, // Simplified — full tx parsing requires getTransaction
    amount: '0',
    counterparty: 'unknown',
    timestamp: sig.blockTime
      ? new Date(sig.blockTime * 1000).toISOString()
      : new Date().toISOString(),
    confirmed: sig.err === null,
  }));
}
