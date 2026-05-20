/**
 * @stacks/connect v8 wraps a wallet-agnostic flow that works with Leather,
 * Xverse, Asigna, and any other Stacks wallet implementing the same JSON-RPC
 * spec. The session is persisted in localStorage under a key the library owns.
 *
 * We deliberately do NOT restrict to a single wallet — restricting would
 * exclude legitimate users of Xverse / Asigna for no good reason.
 */
import { connect, disconnect, isConnected, getLocalStorage } from '@stacks/connect';

export interface StacksAddresses {
  stx: string;
  btc: string;
}

/**
 * Open the wallet picker and connect to the chosen Stacks wallet.
 * Resolves with the connected addresses, or null if the user cancelled.
 */
export async function connectStacksWallet(): Promise<StacksAddresses | null> {
  await connect();
  return readStacksAddresses();
}

export function disconnectStacksWallet(): void {
  disconnect();
}

export function isStacksWalletConnected(): boolean {
  if (typeof window === 'undefined') return false;
  return isConnected();
}

/**
 * Pull the current Stacks + Bitcoin addresses from the persisted session.
 * Returns null when no wallet is connected or when the session lacks an
 * address pair (e.g. an older wallet that only surfaced STX).
 */
export function readStacksAddresses(): StacksAddresses | null {
  if (typeof window === 'undefined') return null;
  if (!isConnected()) return null;

  const data = getLocalStorage();
  const stxEntry = data?.addresses?.stx?.[0]?.address;
  const btcEntry = data?.addresses?.btc?.[0]?.address;
  if (!stxEntry || !btcEntry) return null;

  return { stx: stxEntry, btc: btcEntry };
}
