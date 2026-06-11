# 0015 — WalletConnectionController and the wallet source port

- **Status:** Accepted
- **Date:** 2026-06-11

## Context

ADR [0013](./0013-controller-messenger-pattern-spike.md) built a faithful-minimal
mirror of MetaMask's controller/messenger core (`@stackr/controllers`) as a study
spike, quarantined to `/labs`, with two controllers — Preferences and Portfolio —
demonstrating cross-controller coordination through the messenger. It deferred
one thing explicitly: `PortfolioController.refresh(wallets)` took its address list
by argument, because "a real PortfolioController would likely pull accounts from
another controller via the messenger (`AccountsController:listAccounts`)" and that
controller did not exist yet.

Issue #74 (phase 2) builds that upstream controller. Today each wallet stack is
wired straight into the UI by its own React effect component:
`connected-address-sync.tsx` watches wagmi's `useAccount()` and pushes into the
Zustand store; `connected-solana-address-sync.tsx` does the same for the Solana
wallet-adapter; and `use-wallet-connections.ts` owns the Leather/Stacks path
inline. Three wallet SDKs, three bespoke sync paths, no single place that knows
"what is connected".

This is exactly the seam MetaMask's `AccountsController` fills — but the topology
is **inverted**. MetaMask sits between **one** wallet and **many** dapps: one
keyring, one account list, fanned out to every connected site. stackr sits between
**many** wallet sources (EVM, Solana, Stacks) and **many** chains (BTC, ETH, SOL,
STX): a watch-only portfolio tracker aggregating whatever the user connects or
watches. So where MetaMask has a single account list, stackr's connection state is
keyed by source.

## Decision

Add a third controller, `WalletConnectionController`, and a vendor-agnostic
**wallet source port** it programs against. This is the part-1 slice of #74; the
`ActivityController` (part 2) builds on the same `:stateChange` event.

### The `WalletSourceAdapter` port

```ts
interface WalletSourceAdapter {
  readonly id: string;
  readonly chains: Chain[];
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getAccounts(): WalletAccount[];
  onAccountsChanged(callback: (accounts: WalletAccount[]) => void): () => void;
}
```

A `WalletAccount` is `{ address, chain }` — the smallest domain shape the
controller needs. The port is the same anti-corruption boundary the data
providers draw in ADR [0012](./0012-provider-anti-corruption-layer.md): every
wagmi / `@solana/*` / `@stacks/*` type stays **inside** its adapter, and the
controller only ever sees `WalletAccount`s. That keeps the controller free of
vendor SDKs and lets the unit tests drive it with trivial in-memory adapters (no
DOM, no network).

Three adapters implement the port:

- **EVM** (`createEvmWalletAdapter`) over `wagmi/actions` — `getAccount` /
  `watchAccount` / `connect` / `disconnect`. `watchAccount` is the non-React
  equivalent of the `useAccount()` the old sync component watched.
- **Solana** (`createSolanaWalletAdapter`) over a single wallet-adapter instance.
  It depends on a tight structural surface (`SolanaWalletSource`: `publicKey`,
  `connect`, `disconnect`, `on`/`off`) rather than the sprawling vendor `Adapter`
  union — the ACL boundary in its narrowest form; the real Phantom adapter
  satisfies it structurally.
- **Stacks** (`createStacksWalletAdapter`) over `@stacks/connect`. This is the
  case that makes the inverted topology concrete: **one** connected source yields
  **two** accounts, a STX address and a BTC address, from a single session.

### Where the adapters live: `apps/web`, not `packages`

ADR 0012's data-provider adapters live in `packages/services` because they are
pure functions over `fetch` with no app state. These wallet adapters are
different: each wraps a **live, app-instantiated** provider singleton — the wagmi
`Config`, the Phantom adapter instance handed to `WalletProvider`, the
`@stacks/connect` localStorage session. They cannot exist without the app's
provider tree. So the **port** (the contract) lives in `packages/controllers`
beside the controller, and the **adapters** (the vendor wrappers) live in
`apps/web/src/lib/wallet-adapters/`. The dependency arrow points the right way:
the controller depends on the port; the app depends on both.

### `chains`, not `chain`, per source

The issue sketched the per-source state as `{ status, accounts, chain }`. It is
`chains: Chain[]` here, because Stacks connect yields a STX **and** a BTC account
from one session — the multi-chain-per-source case that is the entire point of the
inverted topology. A singular `chain` could not describe the Stacks source
honestly; `accounts` already carries each account's own `chain`, and `chains`
mirrors the adapter's declared coverage.

### Controller shape and the MetaMask mapping

State is `{ sources: Record<sourceId, { status, accounts, chains }> }`, with the
single `sources` property flagged `persist: false` (connection state is re-derived
from the SDKs on load, exactly as `wallet-store` excludes `connectedAddresses`
from its persisted slice) and `includeInStateLogs: false` (an address links a
person to their holdings — the same redaction judgement PortfolioController applies
to `holdings`/`totalValue`). Actions `connect(sourceId)` / `disconnect(sourceId)`
are registered on the messenger; `:stateChange` is published like every
controller.

| This controller                                     | Real MetaMask                                                | Notes                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `WalletConnectionController`                        | `AccountsController` (+ the connection/keyring layer)        | Owns "which accounts exist and which are connected", and announces changes on `:stateChange`.                        |
| `state.sources` keyed by `sourceId`                 | a single internal account list                               | The inverted topology: many sources → one controller, instead of one wallet → many dapps.                            |
| `WalletSourceAdapter` port                          | keyring / provider abstraction                               | `connect`/`disconnect`/`getAccounts`/`onAccountsChanged`, narrowed to what a watch-only tracker needs.               |
| `connect` / `disconnect` actions                    | `AccountsController` mutating actions                        | Drive the `connecting → connected`/`error` transitions an adapter's passive event stream cannot express on its own.  |
| `onAccountsChanged` → `:stateChange`                | `AccountsController:selectedAccountChange` / `stateChange`   | An external connect (reconnect, autoConnect, account switch) flows in through the adapter and out on `:stateChange`. |
| `selectConnectedAccounts` / `selectAccountsByChain` | account selectors                                            | Pure derived views, never getters on the controller (the ADR 0013 selector rule).                                    |
| `PortfolioController` subscribes to `:stateChange`  | `TransactionController` / others reacting to account changes | The coordination ADR 0013 deferred: the portfolio now re-aggregates when accounts change, with no direct reference.  |

### Collapsing the sync components

The production wiring (`WalletConnectionBridge`, mounted in `providers.tsx`)
builds a `WalletConnectionController` with the **EVM and Solana** adapters and
mirrors its state into `wallet-store.connectedAddresses`. This replaces
`connected-address-sync.tsx` and `connected-solana-address-sync.tsx` exactly —
the two chains those components owned — so every existing consumer
(`chain-status-indicators`, the dashboard, the charts page, `use-wallet-
connections`) keeps working unchanged. The change is strictly additive.

Stacks/Leather is **not** bridged in production yet: it already has its own
session-restore-and-mirror path in `use-wallet-connections.ts`, and routing it
through the controller too would double-write its `stx`/`btc` addresses. The
Stacks adapter is fully implemented and exercised in `/labs` and in the contract
tests; folding the Leather path into the controller is left as a clean follow-up.

### Watch-only stays signature-free

No address-verification or signing flow exists, and none is added (reaffirming
ADR 0013). A source reports the accounts it already holds; the controller never
asks it to _prove_ an address. A watch-only address added elsewhere is simply an
account with no source connection behind it. The `connected`/`disconnected`
distinction is derived from whether a source currently reports accounts — never
from a forced signature. A user may watch cold storage, an exchange address, or
any address they do not control, and that path touches none of this controller's
signing-free surface.

## Consequences

**Positive:**

- One place knows what is connected, behind one port with three faithful
  implementations. The two `*-address-sync` effect components collapse into
  adapter subscriptions feeding the controller.
- The ADR 0013 deferral is closed: `PortfolioController` re-aggregates through the
  messenger when the connected account set changes, with no reference between the
  two controllers — debounced against status-only `:stateChange`s so a
  `connecting` flip does not trigger a refetch.
- The vendor SDKs stay quarantined inside their adapters (ADR 0012), so the
  controller is unit-tested with in-memory stubs and each adapter is contract-
  tested against a stubbed vendor object — no DOM, no real wallet.
- Strictly additive: the production bridge writes the same `connectedAddresses`
  the old components did, so the rest of the app is untouched.

**Negative / trade-offs:**

- Two `WalletConnectionController` instances now exist at runtime — the production
  bridge (EVM + Solana → store) and the `/labs` demo (all three → portfolio
  coordination). They watch the same vendor singletons independently. This is the
  cost of keeping the `/labs` spike self-contained per ADR 0013 rather than
  promoting one app-wide controller graph.
- Stacks is mirrored in two places until the Leather path is folded in (above).
- The Solana adapter wraps a module-singleton Phantom instance shared with
  `WalletProvider` so its events reach the controller; both must stay pointed at
  the same instance.

## Notes

- Core: `packages/controllers/src/WalletConnectionController.ts` (+ co-located
  tests, and the coordination test in `coordination.test.ts`). Adapters:
  `apps/web/src/lib/wallet-adapters/` (+ co-located contract tests). Bridge:
  `apps/web/src/components/wallet-connection-bridge.tsx`. Demo: the
  WalletConnectionController panel on `/labs`.
- Adapter `onAccountsChanged` implementations are SSR-guarded (`typeof window`)
  so constructing a controller during a server render registers no listeners on
  the module-singleton vendors; the client rebuild wires them for real.
- Related: ADR [0012](./0012-provider-anti-corruption-layer.md) (the ACL rule),
  ADR [0013](./0013-controller-messenger-pattern-spike.md) (the core spike and the
  deferral this closes), ADR [0009](./0009-wallet-connect-architecture.md) /
  [0010](./0010-solana-wallet-stack.md) / [0011](./0011-stacks-wallet-stack.md)
  (the three wallet stacks these adapters wrap).

```

```
