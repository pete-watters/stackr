# 0011 — Stacks wallet stack: `@stacks/connect` with dual STX+BTC address sync

- **Status:** Accepted
- **Date:** 2026-05-19

## Context

Stackr supports both Stacks (STX) and native Bitcoin (BTC) chains in its watch-only flow. When adding wallet-connect, Stacks has a unique property: most Stacks wallets — Leather, Xverse, Asigna — surface **both** the user's Stacks address and the corresponding derived Bitcoin address (a P2WPKH receive address) from the same identity.

This is a meaningful UX win for stackr. A single connection lights up two chains worth of holdings. No other ecosystem in the v1 scope has this property (MetaMask is ETH-only, Phantom is SOL-only).

The official Stacks Foundation library is `@stacks/connect`. It's wallet-agnostic: the same code works with Leather, Xverse, and Asigna, and the wallet picker UI lets the user choose. v8 of the library uses a JSON-RPC-style `request()` API, with `connect()`/`disconnect()`/`isConnected()` helpers and `getLocalStorage()` to read the persisted session.

## Decision

Use **`@stacks/connect` v8+**. Do NOT restrict the wallet list to Leather specifically — Xverse and Asigna users get the same flow at no cost. The wallet picker is the wallet picker.

On connect, read both addresses from the persisted session and write each into its own slice of the existing `wallet-store`:

- STX address → `connectedAddresses.stx`
- BTC address → `connectedAddresses.btc`

Both slices light up the "Connected" badge on the corresponding wallet cards in the portfolio view (Stacks and Bitcoin), exactly the same way ETH and SOL do.

`@stacks/connect` persists the session in localStorage itself (keyed by `'stacks-connect-session'`). On page mount, `<LeatherConnectButton />` calls `readStacksAddresses()` and re-mirrors the persisted session into `wallet-store` — that gives us reconnect-after-refresh without any extra plumbing.

Disconnect calls `disconnect()` from the library (which clears the persisted session) and then clears both `stx` and `btc` slices in `wallet-store`.

The button itself is hand-rolled in `apps/web/src/components/leather-connect-button.tsx` using `@stackr/ui`'s `<Button>` primitive — `@stacks/connect` doesn't ship a polished UI button to wrap, unlike RainbowKit or `@solana/wallet-adapter-react-ui`. This is the only chain where the Phase-1 button is already in our design system rather than a temporary library scaffold; the unified connect modal ([#21](https://github.com/pete-watters/stackr/issues/21)) will replace all three buttons regardless.

BNS reverse resolution (`.btc` names) is added to `packages/services/src/stx.ts` as `lookupStacksBnsName(address)` — it hits `https://api.hiro.so/v1/addresses/stacks/{address}` and returns the first owned BNS name or `null`. Used by the wallet card caption.

## Consequences

**Positive:**

- One connection covers two chains. This is a real and unusual property of the Stacks ecosystem, and showing it off in the demo is part of the senior-frontend signal.
- Wallet-agnostic flow — Xverse and Asigna users are first-class without code changes.
- Library handles session persistence; our reconnect-after-refresh logic is one `useEffect` in the button component.

**Negative:**

- The library's `getLocalStorage()` shape is its own internal contract. If the persisted-session shape changes between minor versions, our `readStacksAddresses()` reader will need to update. Mitigated by defensive parsing (returns `null` when shape doesn't match).
- The BTC address surfaced by Leather is the user's _primary receive_ address (P2WPKH). Users with cold storage on a separate BTC-only key won't see those holdings via the Leather connection — that case is what the watch-only address flow is for.

## Notes

- Tracking issue: [#20](https://github.com/pete-watters/stackr/issues/20).
- Related ADRs: [0008](./0008-design-system-direction.md), [0009](./0009-wallet-connect-architecture.md), [0010](./0010-solana-wallet-stack.md).
- The button does not inject a provider into the `Providers` chain — `@stacks/connect` is imperative, not context-based, so no top-level provider is required. This is different from wagmi and `@solana/wallet-adapter-react`, both of which require wrapping the app.
- Stacking position (`/v2/pox/{address}`) is intentionally not surfaced in this PR. Listed as a stretch in [#20](https://github.com/pete-watters/stackr/issues/20); deferred until the portfolio view has a natural place to render it.
