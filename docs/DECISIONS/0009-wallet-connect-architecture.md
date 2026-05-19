# 0009 — Wallet-connect architecture

- Status: Accepted
- Date: 2026-05-19

## Context

Stackr already has a watch-only address model: users paste any BTC/STX/ETH/SOL
address and the app fetches balances via `packages/services/*.ts`. Issue #18
asks for MetaMask wallet-connect so users can authenticate with their actual
wallet rather than typing an address.

Two design questions arose:

1. **Does wallet-connect change the service layer?** The services accept a chain
   - address string and return a balance. They have no concept of "connected vs
     watch-only". Adding wallet-connect could have required the services to handle
     signed requests, session tokens, or provider injection.

2. **Where does the connected address live?** Options were: (a) auto-add it as a
   `Wallet` row in the persisted store, (b) keep it in a separate ephemeral
   slice, or (c) derive it from wagmi state on every render.

## Decision

### Services are unchanged

`packages/services` receive an address string; they don't care where it came
from. Wallet-connect is treated as an _address-discovery_ layer that feeds into
the same pipeline. This keeps the services unit-testable in isolation and
decouples authentication from data-fetching.

### Unified `wallet-store.ts` with a non-persisted `connectedAddresses` slice

`useWalletStore` now holds two things:

- `wallets` — user-managed watch-only addresses, persisted to localStorage via
  Zustand `persist` (unchanged).
- `connectedAddresses: Partial<Record<Chain, string[]>>` — addresses discovered
  from connected wallets, **not persisted**. wagmi's own reconnect logic
  re-populates this slice after a page refresh via `ConnectedAddressSync`.

The `partialize` option in Zustand's persist middleware excludes
`connectedAddresses` from storage. This avoids stale addresses surviving a
wallet disconnect that happens outside the app.

The dashboard merges both sources into `allWallets` at render time, deduplicates
ETH addresses that are already watched, and passes `connected={true}` to
`WalletCard` for any address in `connectedAddresses`. Both sources contribute
to the portfolio total.

### MetaMask only (v1)

The wagmi config restricts the RainbowKit connector list to `metaMaskWallet` via
`getDefaultConfig({ wallets: [{ groupName: 'Recommended', wallets: [metaMaskWallet] }] })`.
WalletConnect and Coinbase Wallet are excluded for a focused demo. A unified
hand-rolled connect modal (#21) will revisit the multi-wallet story.

### RainbowKit `<ConnectButton />` as first pass

The accept/disconnect/reconnect UX is delegated to RainbowKit's `ConnectButton`
for now. The button will be replaced with a custom component in #21.

## Consequences

- `packages/services` has zero diff — no risk to existing balance-fetching.
- Reconnect-after-refresh works because wagmi stores connector state in
  localStorage independently; `ConnectedAddressSync` picks up the reconnected
  address on mount.
- Connected addresses that are _also_ watch-listed show the "Connected" badge
  rather than being duplicated.
- ENS reverse resolution is wired into `WalletCard` for all ETH addresses (watch
  and connected) via a TanStack Query hook with a 5-minute stale time.
- The `NEXT_PUBLIC_ALCHEMY_API_KEY` env var is used for both the wagmi transport
  and the viem public client used for ENS resolution; it falls back to the
  public RPC when absent.

## Notes

- A real WalletConnect project ID is not required because no WalletConnect-based
  wallet is included in the connector list. `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
  is read as an optional env var for future use.
- The `@opennextjs/aws` override added to root `package.json` unblocks
  installation in this environment where `pkg.pr.new` is inaccessible; it has no
  runtime effect.
