import type { Balance } from '@stackr/models';
import { chainMeta } from '@stackr/models';

const HIRO_API = 'https://api.hiro.so';

interface HiroStxBalanceResponse {
  balance: string;
  total_sent: string;
  total_received: string;
  locked: string;
}

export async function fetchStxBalance(address: string): Promise<Balance> {
  const res = await fetch(`${HIRO_API}/extended/v1/address/${address}/stx`);

  if (!res.ok) {
    throw new Error(`Failed to fetch STX balance: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as HiroStxBalanceResponse;

  const { decimals } = chainMeta.stx;
  const rawBalance = data.balance;
  const balance = (Number(rawBalance) / 10 ** decimals).toFixed(decimals);

  return {
    chain: 'stx',
    address,
    rawBalance,
    balance,
    updatedAt: new Date().toISOString(),
  };
}

interface HiroBnsNamesResponse {
  names: string[];
}

/**
 * Reverse-resolve a Stacks address to its primary BNS name (e.g. `pete.btc`).
 * Returns the first name owned by the address, or null if the address holds
 * no BNS names or the Hiro endpoint errors out.
 */
export async function lookupStacksBnsName(address: string): Promise<string | null> {
  const res = await fetch(`${HIRO_API}/v1/addresses/stacks/${address}`);
  if (!res.ok) return null;
  const data = (await res.json()) as HiroBnsNamesResponse;
  return data.names?.[0] ?? null;
}
