# 0010 — Solana wallet stack: `@solana/wallet-adapter` with Phantom-only

- **Status:** Accepted
- **Date:** 2026-05-19

## Context

We need to add Solana wallet-connect to stackr alongside the existing wagmi/RainbowKit MetaMask integration (see [0009](./0009-wallet-connect-architecture.md)). Two reasonable libraries exist:

1. **`@solana/wallet-adapter-react`** — the Solana Foundation's official, ecosystem-standard adapter framework. Works with every Solana wallet that ships an adapter package (Phantom, Solflare, Backpack, Glow, etc.) under one unified hook (`useWallet`).
2. **`@phantom/react-sdk`** — Phantom's first-party React SDK. Tighter coupling to Phantom-specific features, but locks the integration to one wallet brand.

For an end-user-facing product, locking to one wallet brand is hostile UX (users who hold SOL in Solflare or Backpack get told "install Phantom"). For an interview demo, the wallet-adapter pattern reads as more thoughtful — "this engineer thought about the user's wallet choice" — than the branded SDK.

The connect modal (issue [#21](https://github.com/pete-watters/stackr/issues/21)) will eventually unify all three chain flows into one hand-rolled `@stackr/ui` component. The Phase-1 button comes from `@solana/wallet-adapter-react-ui` (`<WalletMultiButton />`) and is a temporary scaffold, matching how the Phase-1 ETH button comes from RainbowKit.

## Decision

Use **`@solana/wallet-adapter-react`** (+ `-react-ui`, + `-phantom`). Restrict the `wallets` array to a single `PhantomWalletAdapter` for v1 — mirroring the MetaMask-only choice for ETH. Both restrictions are reversible by editing one line each; they keep the v1 demo focused on the three wallets Pete actually wants in the screen recording (MetaMask + Phantom + Leather).

Solana provider chain composes inside the existing `Providers` wrapper, between `RainbowKitProvider` and `TooltipProvider`:

```
ThemeProvider
  WagmiProvider
    QueryClientProvider
      RainbowKitProvider
        ConnectionProvider (Solana RPC)
          WalletProvider (Phantom-only)
            WalletModalProvider
              TooltipProvider
                ConnectedAddressSync (ETH → store)
                ConnectedSolanaAddressSync (SOL → store)
                {app}
```

RPC endpoint: Helius mainnet when `NEXT_PUBLIC_HELIUS_API_KEY` is set, public `clusterApiUrl('mainnet-beta')` otherwise. Free Helius tier is generous; no key required for the demo.

`autoConnect` is enabled so a returning visitor's Phantom session re-establishes silently, matching wagmi's reconnect-after-refresh behaviour.

`<WalletMultiButton />` is loaded via `next/dynamic({ ssr: false })` — the wallet-adapter UI touches `window` during render and triggers hydration mismatches under the App Router otherwise.

## Consequences

**Positive:**

- Connecting Solflare/Backpack/etc later is a one-line change (add the relevant adapter to the `wallets` array). No architectural rework.
- One `useWallet()` hook covers every Solana wallet uniformly — `wallet-store` doesn't care which adapter produced the address.
- The wallet-adapter ecosystem is the dominant pattern in Solana — any senior Solana engineer reviewing the code recognises it immediately.

**Negative:**

- Phantom-specific features (e.g. Phantom embedded wallets, in-app browser deep links) are not accessible through this layer. If we ever want them, we add `@phantom/react-sdk` as a parallel integration, not a replacement.
- The wallet-adapter UI's default button styling is generic. Acceptable for Phase 1; replaced by hand-rolled UI in [#21](https://github.com/pete-watters/stackr/issues/21).
- The wallet-adapter packages add ~120KB to the client bundle. Tolerable for a demo; revisit if Lighthouse budget pressure shows up in Phase 3.

## Notes

- Tracking issue: [#19](https://github.com/pete-watters/stackr/issues/19).
- Related ADRs: [0008](./0008-design-system-direction.md) (no dashboard libs), [0009](./0009-wallet-connect-architecture.md) (additive wallet-connect layer).
- The Solana address ends up in `wallet-store.connectedAddresses.sol` via `ConnectedSolanaAddressSync` — same shape as the ETH equivalent.
