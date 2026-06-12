import { z } from 'zod';
import { ChainSchema } from './chain.js';
import { TransactionSchema } from './transaction.js';

/**
 * Activity — a normalized cross-chain transaction, enriched for the unified
 * activity feed.
 *
 * The per-chain services already normalize raw provider history into one
 * `Transaction` shape (hash, chain, type, amount, counterparty, timestamp,
 * confirmed). `Activity` is the *feed* shape on top of that: the same
 * transaction, plus the four fields the merged, multi-wallet feed needs that a
 * single transaction in isolation does not carry.
 *
 * It mirrors the entry shape MetaMask's activity-list builds over its
 * `TransactionController` history — generalized from one chain to four. Where
 * MetaMask tags each entry with its provenance and a `TransactionType`
 * category, this tags each entry with the per-chain *source* it was merged
 * from, the watched *wallet* it belongs to, a normalized *direction*, and a
 * coarse *category*.
 */

/**
 * Normalized direction, derived from the transaction `type`. `receive` →
 * `incoming`, `send` → `outgoing`. The vocabulary matches MetaMask's
 * incoming/outgoing language rather than the raw send/receive the providers
 * emit, so the feed reads the same regardless of which chain produced the row.
 */
export const ActivityDirectionSchema = z.enum(['incoming', 'outgoing']);

export type ActivityDirection = z.infer<typeof ActivityDirectionSchema>;

/**
 * Coarse classification of the activity. Our four normalizers only emit value
 * transfers, so `transfer` is the common case. `unknown` flags an entry whose
 * direction and amount could not be determined from the source data — the
 * Solana signatures path, which yields a hash and a timestamp but no amount or
 * counterparty (those need a per-signature `getTransaction`). Keeping that
 * honesty in the type means the UI can render a "could not classify" row rather
 * than mislabel a placeholder as a real receive. MetaMask's richer category set
 * (swap, approve, contract-interaction, …) collapses to this pair because a
 * watch-only tracker never sees those flows.
 */
export const ActivityCategorySchema = z.enum(['transfer', 'unknown']);

export type ActivityCategory = z.infer<typeof ActivityCategorySchema>;

export const ActivitySchema = TransactionSchema.extend({
  /**
   * The per-chain feed source this entry was merged from. It equals the
   * transaction's own `chain`, but is the semantic key the controller dedupes,
   * cursors (`cursorBySource`), and slices on — the merge happens *by source*,
   * so the source is recorded on every row.
   */
  source: ChainSchema,
  /** The watched address this entry belongs to (drives the per-wallet slice). */
  wallet: z.string(),
  direction: ActivityDirectionSchema,
  category: ActivityCategorySchema,
});

export type Activity = z.infer<typeof ActivitySchema>;
