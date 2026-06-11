# 0017 — ActivityController and the cross-chain activity feed

- **Status:** Accepted
- **Date:** 2026-06-11

## Context

ADR [0013](./0013-controller-messenger-pattern-spike.md) built a faithful-minimal
mirror of MetaMask's controller/messenger core (`@stackr/controllers`) and ADR
[0015](./0015-wallet-connection-controller.md) added the `WalletConnectionController`
— the upstream that knows "which accounts exist and which are connected" and
announces changes on `:stateChange`. Issue #74 part 2 builds the second consumer
of that signal: the activity feed.

The raw material already exists. `packages/services/src/transactions.ts`
normalizes each chain's provider history — Blockstream (BTC), Etherscan (ETH),
Hiro (STX), Solana RPC signatures — into one domain `Transaction` shape behind
`fetchTransactions(chain, address)`, drawing the same anti-corruption boundary
(ADR [0012](./0012-provider-anti-corruption-layer.md)) the balance/price
providers do. What did not exist was the _stateful_ layer the README's "recent
activity" deserves: today the dashboard panel fetches each wallet's history in
its own `useTransactions` child component and merges the results in render, and
the wallet-detail page calls `useTransactions` directly. There is no single place
that owns "the feed", no dedupe, and no reaction to a wallet connecting or being
added.

This is exactly the seam MetaMask's `TransactionController` + activity-list
pipeline fills — and, like the wallet layer, the topology is **inverted**.
MetaMask's `TransactionController` owns the transactions of **one** wallet on
**one** chain at a time; its activity list is a single-account, single-network
history with rich `TransactionType` categories (swap, approve,
contract-interaction). stackr aggregates **many** watched/connected addresses
across **four** chains into one feed, where each chain is a _source_ that must be
fetched, normalized, and merged.

## Decision

Add a fourth controller, `ActivityController`, over the existing transaction
normalizers, plus an `Activity` domain type in `packages/models`.

### The `Activity` type

`Activity` extends `TransactionSchema` (so every normalized field round-trips
unchanged through Zod) with the four fields a merged, multi-wallet feed needs
that a single transaction in isolation does not:

```ts
const ActivitySchema = TransactionSchema.extend({
  source: ChainSchema, // the per-chain feed source the row was merged from
  wallet: z.string(), // the watched address it belongs to
  direction: z.enum(['incoming', 'outgoing']),
  category: z.enum(['transfer', 'unknown']),
});
```

- **`source`** equals the transaction's own `chain`, but is the semantic key the
  feed is built around — the merge happens _by source_, cursors are kept
  per-source, and the per-chain slice selector reads it. Recording it on every
  row keeps "where did this come from" explicit rather than re-deriving it.
- **`wallet`** is what makes the per-wallet slice possible: the wallet-detail
  page filters the one merged feed down to its address rather than re-fetching.
- **`direction`** normalizes the raw `send`/`receive` `type` to MetaMask's
  `incoming`/`outgoing` vocabulary, so the feed reads identically across chains.
- **`category`** is `transfer`, or `unknown` for a row whose amount _and_
  counterparty could not be determined — the Solana signatures path, which
  yields a hash and a timestamp but placeholders amount (`'0'`) and counterparty
  (`'unknown'`) because deriving them needs a per-signature `getTransaction`.
  Keeping that honesty in the type lets the UI render an "unclassified" row
  rather than mislabel a placeholder as a real receive. MetaMask's richer
  category set collapses to this pair because a watch-only tracker never
  originates a swap or an approval.

### Controller shape and the MetaMask mapping

State is `{ items, cursorBySource, status }`. `refresh(scope?)` fans out through
`fetchTransactions` (injected, defaulting to the real services adapter, so the
unit tests drive it with an in-memory table — no network, no DOM), enriches each
`Transaction` into an `Activity`, dedupes, and merge-sorts into one descending
feed.

| This controller                              | Real MetaMask                                    | Notes                                                                                           |
| -------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `ActivityController`                         | `TransactionController` + activity-list pipeline | Owns the feed; announces changes on `:stateChange`; UI mirrors it.                              |
| `state.items` (one merged feed)              | per-account/per-network transaction state        | The inverted topology: many sources → one feed, instead of one wallet/network → one history.    |
| `source` on every row + `cursorBySource`     | `chainId` + per-network nonce/block tracking     | The feed is merged _by source_, so the source and its high-water mark are first-class.          |
| `refresh(scope?)`                            | `updateIncomingTransactions` / poll              | One fan-out across every watched address; a scope re-fetches just one slice.                    |
| dedupe on `(chain, hash)`                    | dedupe incoming vs outgoing by hash              | A self-transfer between two watched wallets collapses to one row.                               |
| `direction` / `category`                     | `TransactionType` / `txParams`                   | Generalized to the two cases a watch-only tracker actually sees.                                |
| subscribes to `WalletConnection:stateChange` | controllers reacting to `AccountsController`     | The feed re-runs when the connected set changes, with no reference between the two controllers. |
| `selectActivityByWallet` / `…ByChain`        | activity-list selectors                          | Pure derived views, never getters on the controller (the ADR 0013 selector rule).               |

### The normalization pipeline

`refresh` is four steps, all pure except the fetch:

1. **Fan-out.** `Promise.allSettled` over every target wallet's
   `fetchTransactions(chain, address)`.
2. **Enrich.** `toActivity(tx, wallet)` maps each `Transaction` to an `Activity`
   (direction from `type`, category from the placeholder check, source from
   `chain`).
3. **Dedupe.** A `Map` keyed on `${chain}:${hash}` keeps the first occurrence —
   so a transaction surfaced from both sides of a watched-to-watched transfer
   becomes one feed entry (attributed to the first wallet seen).
4. **Merge-sort.** One `sort` by `timestamp` descending.

`toActivity`, `dedupeAndSort`, and the selectors are exported pure functions,
unit-tested in isolation with no controller or messenger in scope.

### Dedupe + cursor strategy

Dedupe is on `(chain, hash)`, not `hash` alone, because a hash is only unique
_within_ a chain. The consequence — one row per on-chain transaction, even a
self-transfer between two watched wallets — is intentional; the per-wallet
selector then attributes it to the first wallet seen, which is complete for any
single watched address (collisions only happen across two watched addresses).

`cursorBySource` is a `chain → newest-timestamp` map. It is deliberately a
**high-water mark, not an opaque pagination token**: the underlying normalizers
return the latest page (the providers' first ~20 results) rather than a cursor,
so "where we are" in each source is best expressed as the newest row we hold,
usable as a "what's new since last visit" boundary. This is the honest shape of
the data we have, and a clean divergence from MetaMask's true block/nonce
cursors to note rather than paper over.

### Two triggers, one feed

The wallet set `refresh` targets is the union of two inputs, mirroring the
issue's two triggers:

- **Connected accounts** arrive through the messenger: the controller subscribes
  to `WalletConnectionController:stateChange` and flattens the connected accounts
  into wallet refs — no reference to that controller, the same decoupling
  PortfolioController uses (ADR 0015).
- **Watch-only addresses** are pushed in via `setWatchedWallets`, the bridge from
  the Zustand wallet store (which lives in the app, not a controller, so it
  cannot be a messenger event).

Either changing re-runs the feed, **debounced** against status-only
`:stateChange`s via a sorted wallet-set key — a `connecting` flip leaves the
address set untouched and must not refetch, exactly the debounce
PortfolioController applies.

### Partial-failure tolerance

Fan-out uses `Promise.allSettled`, not `Promise.all`. This is a deliberate
divergence from PortfolioController's all-or-nothing refresh: a portfolio _total_
is wrong if one leg is missing, but an activity _feed_ is still useful when one
chain's provider is rate-limited or flaky. So a refresh keeps every source that
succeeded and only surfaces `status: 'error'` when **every** source failed (and
then rethrows the first error for an awaiting caller). A wallet-set-driven
refresh has no caller to await it, so its rejection is swallowed — the failure is
already reflected in `status`.

### UI: thin mirrors, additive

The production wiring mounts one `ActivityControllerProvider` app-wide (in
`providers.tsx`) and bridges the store into it via `setWatchedWallets`, unioning
the watch-only `wallets` with the `connectedAddresses` the `WalletConnectionBridge`
already maintains. The two activity surfaces become thin mirrors with their
rendering untouched:

- the dashboard **recent-activity** panel drops its per-wallet `useTransactions`
  fetcher children and reads the already-merged feed off `useActivityState`;
- the **wallet-detail** transaction list derives from `selectActivityByWallet`
  sliced to the viewed wallet. Because `Activity` is a structural superset of
  `Transaction`, the presentational `TransactionList` renders it unchanged.

A `useTrackWallet` escape hatch pins an address reached by direct URL so its feed
loads even when it is not in the store. `/labs` gains an ActivityController panel
on the demo's shared messenger, so connecting a wallet re-runs the feed through
`:stateChange`.

## Consequences

**Positive:**

- One place owns the cross-chain feed, with dedupe and merge-sort it previously
  lacked, behind the same ACL the data providers use (ADR 0012) — so it is
  unit-tested entirely with an in-memory `fetchTransactions` table.
- The feed reacts to both triggers (a wallet connecting, an address being
  watched) with no UI glue, closing the loop the messenger pattern exists for.
- The activity components shrink to mirrors; the per-wallet fan-out-in-render of
  the old `RecentActivity` is gone, replaced by the controller's single fan-out.
- Partial failures degrade gracefully rather than blanking the feed.

**Negative / trade-offs:**

- A third store→controller bridge now exists (preferences mirror, the
  WalletConnectionBridge, and this). They are independent and each one-directional,
  but the app now feeds three controllers from Zustand. Promoting one app-wide
  controller graph remains the eventual consolidation (noted in ADR 0015).
- `cursorBySource` is a high-water mark, not true pagination — the feed shows the
  latest page per source, not deep history. Real cursoring waits on the
  normalizers exposing provider cursors.
- Dedupe on `(chain, hash)` attributes a watched-to-watched transfer to one side;
  the per-wallet slice for the other side does not show it. Acceptable for a
  feed; called out so it is a known property, not a surprise.

## Notes

- Core: `packages/controllers/src/ActivityController.ts` (+ co-located tests).
  Model: `packages/models/src/activity.ts` (+ Zod round-trip test). Production
  wiring: `apps/web/src/lib/controllers/activity-controller-provider.tsx`,
  mounted in `providers.tsx`. Mirrors: `recent-activity.tsx`,
  `wallet-detail-view.tsx`. Demo: the ActivityController panel on `/labs`.
- Related: ADR [0012](./0012-provider-anti-corruption-layer.md) (the ACL the
  transaction normalizers sit behind), ADR
  [0013](./0013-controller-messenger-pattern-spike.md) (the core spike and the
  selector rule), ADR [0015](./0015-wallet-connection-controller.md) (the
  upstream this subscribes to, and the inverted-topology framing).
