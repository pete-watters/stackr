# 0013 — DeFi liquidation-health: protocol-native reads, starting with Aave v3

- **Status:** Accepted
- **Date:** 2026-05-20

## Context

stackr's differentiating feature is **liquidation-risk monitoring** — "am I about to get liquidated?" for a fund manager on the go (the Leather-derived USP). The data research (issue #46) reached a clear conclusion: aggregators (Zerion, DeBank) expose position _value_ but **not** a normalized liquidation _health_ field, so the health signal must be built per-protocol on native reads. That's also why it's defensible — it can't be bought off the shelf, and no aggregator covers Stacks at all.

This ADR covers the first slice: **Aave v3 on Ethereum**, the cheapest and highest-signal entry point.

## Decision

Read liquidation health **directly from each protocol**, chain by chain, rather than through an aggregator. First protocol: **Aave v3**.

- `Pool.getUserAccountData(user)` returns `totalCollateralBase`, `totalDebtBase`, `currentLiquidationThreshold`, `ltv`, and an **on-chain-computed `healthFactor`** (Aave's own oracle) in one read-only call. No subgraph (The Graph hosted service is dead), no API key, CORS-friendly via any RPC.
- Implemented in `apps/web/src/lib/defi/aave.ts` using viem (already a dep). Returns `null` when the address has no borrow position — so a list of cards self-prunes to only positions that can be liquidated.
- A chain-agnostic risk mapper (`apps/web/src/lib/defi/risk.ts`) turns any health factor into `safe | caution | danger` + colour. Aave, Kamino (SOL), and Zest/Granite (STX) will all funnel their computed HF through it.
- Surfaced at `/defi` for every connected + watch-only ETH address.

## Consequences

**Positive:**

- The hardest-to-fake feature ships on the easiest path first — Aave HF is one free call, and "what's my Aave health factor?" is answered literally.
- The risk mapper + card pattern are reusable for every future protocol/chain.
- No backend, no key, no polling — the on-chain read reflects live oracle prices, so an on-demand + 60s cache is enough.

**Negative / follow-ups:**

- Each additional protocol is bespoke: **Kamino** (SOL, free public REST), then **Zest** + **Granite** (STX, Hiro `call-read`, fully custom — the moat). Compound v3 / Spark on EVM are also bespoke ABIs.
- For protocols where we read raw collateral/debt (Stacks), HF is computed locally against a streamed oracle price (Pyth) — see the refresh-model note in #46. Aave doesn't need that (chain computes HF).
- Default viem transport falls back to a public RPC; set `NEXT_PUBLIC_ALCHEMY_API_KEY` for reliability under load.

## Notes

- Research + full architecture: issue #46.
- This is a spike/foundation — UX placement of DeFi cards (dedicated `/defi` page vs dashboard integration) is intentionally minimal and open to iteration.
