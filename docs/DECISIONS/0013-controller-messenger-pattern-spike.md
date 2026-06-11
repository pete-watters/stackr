# 0013 — Controller/messenger pattern spike

- **Status:** Accepted
- **Date:** 2026-06-11

## Context

Stackr's client state lives in two well-understood places: TanStack Query owns
server state (balances, prices, transactions), and Zustand owns persisted client
state (the wallet list, display settings, holdings). That split works and is not
in question here.

This spike exists for a different reason. It is a **study build** of the
controller/messenger pattern that MetaMask uses across its extension and mobile
clients — `@metamask/base-controller` and `@metamask/messenger`. The goal is to
reproduce the _shape_ of that pattern faithfully enough that working through this
code teaches the real thing, while staying small enough to read in one sitting
(~250 lines of core). It lives in a new package, `@stackr/controllers`, and is
wired into exactly one labelled surface (`/labs`). It does **not** replace the
existing Zustand/React Query wiring, and it is **additive** in the strict sense:
nothing else in the app changes behaviour.

### What the pattern is

A **controller** owns a slice of state and is the single source of truth for it.
State is private; the only way to change it is `this.update(draft => …)`, which
runs the mutation through immer and then announces the change. Controllers never
hold references to each other. Instead they share a **messenger**, which carries
two orthogonal kinds of traffic:

- **Actions — request/response.** Exactly one handler per action type.
  `messenger.call('PreferencesController:getState')` invokes it and returns the
  result. This is how one controller synchronously asks another for something.
- **Events — publish/subscribe.** Many handlers per event type.
  `messenger.publish('PreferencesController:stateChange', state)` fans the
  payload out. A subscriber may attach a **selector** so it only wakes when the
  slice it cares about changes. This is how a controller announces a change
  without knowing — or caring — who is listening.

Every action and event is namespaced `'ControllerName:thing'`, which is what
lets one shared messenger host many controllers without collisions.

### Why MetaMask uses it (and why it's arguably overkill here)

MetaMask's core logic must run, unchanged, across very different shells: a
browser-extension background service worker, a React Native app, and assorted
test harnesses. The controller/messenger pattern buys them a **framework-agnostic
core**: the controllers contain the logic and own the state, with zero React in
them, and each client renders by subscribing to `:stateChange`. The messenger's
decoupling also makes a sprawling system tractable — dozens of controllers
coordinate without a dependency graph of direct references, and each is handed a
_restricted_ view so it can only touch an explicit allowlist of other
controllers' surfaces.

For a single Next.js app like Stackr, that justification mostly evaporates. There
is one client. Zustand already gives us a framework-friendly external store, and
React Query already models async server state with caching and invalidation.
Rebuilding those as controllers would be **over-engineering**: more ceremony
(metadata, messenger plumbing, restricted-messenger types) for capabilities we do
not need. The honest conclusion is that the pattern is the right tool for a
multi-client platform and the wrong default for a single app — which is exactly
why this is a scoped spike behind `/labs`, not a migration.

### Why two controllers, not one

One controller in isolation never needs a messenger — it could just expose
methods. The pattern only earns its keep when state in one place depends on state
in another. So the spike ships the smallest pair that demonstrates that:

- **PreferencesController** owns display preferences (display currency, included
  chains) — and _only_ those. It is the real-MetaMask analog: MetaMask ships a
  `PreferencesController`, and changing a preference there ripples outward.
- **PortfolioController** aggregates watched addresses into a single total and
  **re-derives when preferences change** — through the messenger, with neither
  controller referencing the other.

## Decision

Build a faithful **minimal** version in `packages/controllers`, mirroring the
real API names and shapes, rather than depending on the heavy, ecosystem-coupled
`@metamask/*` packages.

### Piece-by-piece mapping to the real APIs

| This spike                                                                  | Real MetaMask                                                      | Notes                                                                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `Messenger<Action, Event>`                                                  | `Messenger` / `ControllerMessenger`                                | Same two-channel design: actions (request/response), events (pub/sub).                                                   |
| `registerActionHandler` / `call`                                            | identical names                                                    | One handler per action; duplicate registration throws; calling an unregistered action throws.                            |
| `publish` / `subscribe(type, handler, selector?)`                           | identical names                                                    | Selector projects the payload; the handler fires only when the selected slice changes, receiving `(selected, previous)`. |
| `ExtractActionParameters` / `ExtractActionResponse` / `ExtractEventPayload` | identical names                                                    | Type utilities that recover a member's params/result/payload from the union by its `type`.                               |
| `BaseController` with `super({ messenger, metadata, name, state })`         | identical                                                          | Auto-registers `Name:getState`, publishes `Name:stateChange`, exposes `this.update`.                                     |
| `this.update(draft => {})` (immer)                                          | identical                                                          | The only path to a state change; produces the next immutable state and publishes it.                                     |
| `StateMetadata` per-property `{ persist, usedInUi, includeInStateLogs }`    | same flags                                                         | See "metadata" below.                                                                                                    |
| `deriveStateForFlag(state, metadata, flag)`                                 | `getPersistentState` / `getAnonymizedState`                        | Projects state down to the properties whose flag is set.                                                                 |
| `getDefault<Name>ControllerState()`                                         | identical convention                                               | Single pure source of the initial state.                                                                                 |
| `messenger.getRestricted<M>()`                                              | `messenger.getRestricted({ name, allowedActions, allowedEvents })` | **Type-narrowing only here** — see differences below.                                                                    |
| Selectors (`selectTotalValue`, …)                                           | derived-state selectors                                            | Derived values are pure functions, never getters on the controller.                                                      |

### How this differs from the real implementation

These are deliberate simplifications, each chosen to keep the spike readable
while staying honest about what was cut:

1. **Single-value event payloads.** Real MetaMask events carry a _spread_
   payload (`payload: unknown[]`, `publish(type, ...payload)`), and the
   `:stateChange` event in particular publishes `[nextState, patches]` — the new
   state plus the immer JSON patches describing what changed. This spike's events
   carry a single payload value (the next state), which is all the demo needs;
   the patches are not produced.

2. **`getRestricted` narrows types but does not enforce them.** In real MetaMask,
   `messenger.getRestricted({ name, allowedActions, allowedEvents })` returns a
   `RestrictedMessenger` scoped to a controller's own namespace plus an explicit
   allowlist, and that restriction is enforced **at runtime** — a controller that
   reaches for an action outside its allowed set throws. Here, `getRestricted<M>()`
   performs the equivalent **type-level** narrowing and returns the same
   underlying messenger; nothing is blocked at runtime. The `Allowed*` type
   aliases in `PortfolioController` document the intended allowlist (its own
   actions/events plus `PreferencesController`'s `getState` action and
   `stateChange` event) even though it is not policed.

3. **Boolean metadata flags.** Real `StateMetadata` lets each flag be a _function_
   of the property value (e.g. persist only part of a field, or redact a subfield
   for logs). This spike uses plain booleans, which is enough to show what the
   flags are _for_.

4. **immer update ergonomics.** This spike commits to immer (`this.update(draft
=> { draft.x = … })`), matching MetaMask. The alternative — hand-written
   immutable updates (`this.setState({ ...state, x })`) — would avoid the
   dependency but lose structural sharing's referential stability, which is what
   makes the selector subscriptions cheap (an unchanged slice keeps its reference,
   so `Object.is` alone tells a subscriber "nothing I care about moved"). immer is
   a small, standard dependency and is the only one this spike adds.

5. **`refresh` takes addresses as an argument.** A real PortfolioController would
   likely pull accounts from another controller via the messenger
   (`messenger.call('AccountsController:listAccounts')`). To avoid inventing a
   third controller, `refresh(wallets)` accepts the address list directly and
   caches it for currency-change replays. The data sources (`fetchBalance`,
   `fetchPrices`, from the Phase-1 provider adapters) are **injected** via the
   constructor — the same seam MetaMask uses for external dependencies — so the
   controller is unit-testable with no network.

### Metadata and the "safe to expose" idea

Every state property is tagged `{ persist, usedInUi, includeInStateLogs }`.
`includeInStateLogs` is the per-field "is this safe to put in a diagnostic dump"
flag, and it is the **same idea as analytics masking**: PortfolioController flags
`holdings` and `totalValue` as `includeInStateLogs: false`, exactly as the app's
own `hideBalance` / `maskFiat` keeps a user's balances off the screen — here the
judgement is applied to logs and telemetry instead of the UI. `deriveStateForFlag`
turns the flags into a real projection, so building a log-safe snapshot is a
single declarative pass rather than a hand-maintained allowlist. The contrast
between the controllers is intentional teaching material: PreferencesController is
`persist: true` (user choices worth keeping) with log-safe scalars, while
PortfolioController is `persist: false` throughout (recomputed from live data) and
redacts the financial fields.

### Two flavours of coordination

The PortfolioController subscribes to `PreferencesController:stateChange` twice,
once per slice, and reacts differently to each — on purpose, because the two
preferences have genuinely different cost profiles:

- **Included-chains change → pure re-derive.** Filtering lives in
  `selectTotalValue` (a selector over already-fetched holdings), so toggling a
  chain on or off recomputes the total **synchronously, with no network**. This
  is the textbook "derived state" demonstration.
- **Display-currency change → async re-fetch.** Prices are denominated _per
  currency_, so a new currency genuinely needs new data; the handler replays the
  last `refresh`, which re-reads the now-current preference and refetches. This is
  the textbook "controller reacts and does async work" demonstration.

Because PreferencesController updates through immer, the unchanged slice keeps its
reference, so a currency write does not spuriously fire the included-chains
handler, and vice versa.

### Explicitly out of scope

No address-verification or signing flow is built, and none should be. Watch-only
addresses are first-class and signature-free in Stackr: a user may watch a
hardware wallet, cold storage, an exchange or contract address, or any address
they do not control. Any connected-vs-watch-only distinction comes from the
existing wagmi/Solana connection state, never from a forced signature.

## Consequences

**Positive:**

- A complete, readable reference implementation of the controller/messenger
  pattern, mapped field-by-field to the real `@metamask/*` APIs, with 35 unit
  tests covering the messenger, the base controller, each controller's
  transitions, the coordination flow, and the React binding.
- The pattern's value is demonstrated concretely: two controllers coordinate via
  the messenger with no direct references, and the UI is a thin mirror of
  controller state via `useSyncExternalStore`.
- Fully additive. The existing Zustand stores and React Query hooks are
  untouched; the spike is reachable only at `/labs`.

**Negative / trade-offs:**

- A second state-management idiom now exists in the repo. This is acceptable only
  because it is quarantined to `/labs` and documented here as a study artifact,
  not a direction. If it ever escaped `/labs`, it would compete with Zustand and
  React Query and muddy "where does state live?".
- `getRestricted` looks like it enforces an allowlist but does not (difference 2
  above). Anyone reading the code must not assume runtime restriction.
- Adds one dependency, `immer` (small, standard; already a transitive peer in the
  tree).

## Notes

- Core lives in `packages/controllers/src`: `Messenger.ts`, `BaseController.ts`,
  `PreferencesController.ts`, `PortfolioController.ts`, `selectors.ts`. The React
  binding (`ControllerProvider`, `useController`) is in
  `apps/web/src/lib/controllers/`, and the demo surface is
  `apps/web/src/app/labs/page.tsx`.
- `refresh` consumes the Phase-1 provider adapters (ADR
  [0012](./0012-provider-anti-corruption-layer.md)) — the controller depends on
  the _ports_, not on any vendor shape.
- The PR for this work is **stacked** on the Phase-1 branch
  (`feat/provider-acl-and-key-proxy`) and retargets to `dev` after Phase 1 merges.
