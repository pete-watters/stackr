# 0016 — Data architecture: free unified portfolio + DeFi liquidation health

- **Status:** Proposed
- **Date:** 2026-06-11

## Context

Stackr's next surface is real-time balances, activity and DeFi position cards
across BTC / STX / ETH / SOL, with the differentiating feature being
**liquidation-risk monitoring**: a watch-only user asking, on the go, "am I
about to get liquidated on Granite or Zest? what's my Aave health factor?".

The hard constraint is the rest of the product: **free or generous-free-tier,
client-side, no backend**. We already run an anti-corruption layer in
`packages/services` (one adapter per source, validated at both boundaries —
see [0012](./0012-provider-anti-corruption-layer.md)) and a single
server-only proxy route for the one key that cannot be domain-restricted
(Helius). Any new data source must fit that shape.

Two facts shape the whole design, and both were re-verified against current
provider reality (June 2026) before writing this ADR:

1. **No single provider covers {balances + activity + NFTs + DeFi} across all
   four chains**, and the aggregators that come closest (Zerion, DeBank) return
   position _value_, not a normalized liquidation _health_. The liquidation
   feature therefore **cannot be bought** — it has to be computed from native
   per-protocol reads.
2. **Stacks has zero aggregator coverage.** Every Stacks number we show is
   already bespoke against the Hiro API. That makes Stacks liquidation cards the
   most expensive thing to build _and_ the thing no competitor can copy by
   swapping in an API key.

Provider churn is a live risk in this space, not a hypothetical: SimpleHash —
a credible NFT/token data API — was acquired by Phantom (Feb 2025) and its
standalone API was sunset within about a month (Mar 2025). Coupling the moat to
any one vendor is how you lose it.

### Alternatives considered

- **Buy a unified aggregator (DeBank / Zerion / Covalent / Moralis) and render
  its DeFi cards.** Rejected as the _basis_ of the feature: they give value, not
  normalized health, give nothing on Stacks, and their keys are secrets that
  force a proxy. Zerion is still worth adding _later_ as a value-card enrichment
  (see Decision), but it is not the liquidation feature.
- **Subgraphs / The Graph for protocol state.** Rejected: the hosted service is
  gone, and a decentralized-network query still needs a key and budget. A direct
  read-only contract call is simpler, free, and CORS-friendly.
- **Background-poll every position to fake "real-time".** Rejected: every free
  tier punishes polling. "Real-time" has to mean on-demand refresh + event- and
  price-driven recompute (see Refresh model), not a polling loop.

## Decision

Adopt a **two-track data architecture**, both tracks living behind the existing
provider ports in `packages/services` and validated at both boundaries.

### Track A — Portfolio surface (balances / activity / NFTs / prices)

- **EVM + Solana:** lead with the **Alchemy Portfolio/Token API**. It is the
  only option that is genuinely client-side-safe without a proxy: app keys are
  restricted by a dashboard **allowlist** (domain / referer, with `*.domain`
  wildcard support), changes apply immediately, and a leaked key cannot be used
  from another origin. Free tier is **30M compute units/month at 500 CUPS** —
  ample for on-demand portfolio reads.
- **Stacks:** the **Hiro Stacks Blockchain API** directly — it is the only
  source. Rate limits are **50 rpm unauthenticated, 500 rpm with a key**; a key
  is read server-side, never bundled.
- **Bitcoin:** Blockstream/mempool for L1 balances (already wired). There is no
  BTC L1 DeFi — the "Bitcoin DeFi" story is the **sBTC / Stacks** story in
  Track B.
- **Later, optional:** add **Zerion** as a normalized DeFi _value_ enrichment
  (8,000+ protocols, one schema) behind a thin same-origin proxy route — its key
  is an HTTP Basic secret and cannot be domain-restricted. This is an
  enrichment, never the liquidation feature.

### Track B — Liquidation health (the USP), native per-protocol reads

**Liquidation health is computed by Stackr from native per-protocol reads, not
read from any aggregator.** This is the explicit, load-bearing decision of this
ADR: the moat is the normalization, and it stays on data we read and math we
control, decoupled from any vendor that can be acquired or sunset.

Each protocol gets one adapter in `packages/services` implementing a new
`HealthAdapter` port and emitting a single normalized `HealthPosition` (see
model below). First-ship protocol set:

- **EVM — Aave v3:** one read-only call, `Pool.getUserAccountData(user)`,
  returns `(totalCollateralBase, totalDebtBase, availableBorrowsBase,
currentLiquidationThreshold, ltv, healthFactor)`. `healthFactor` is `1e18`-
  scaled and computed by Aave's own oracle, so for Aave the live HF is the
  return value — no price stream needed. `ltv` / `currentLiquidationThreshold`
  are basis points. Call goes through our Alchemy RPC (or any public RPC),
  CORS-friendly, free.
- **Solana — Kamino:** the public REST API at `api.kamino.finance` is
  **keyless** and exposes per-obligation LTV and liquidation LTV (Swagger at
  `/documentation`); the exact obligation endpoint is pinned during build. The
  on-chain TS SDK is the fallback if a needed field isn't in REST.
- **Stacks — Zest:** read-only Clarity calls via Hiro `POST
/v2/contracts/call-read/...`. Zest is Aave-style with an explicit **Health
  Factor 1–100** (>100 shown as ∞, <1 = liquidatable); borrow up to **50% LTV**,
  liquidation at **70% LTV** plus a 10% penalty. Health-factor liquidation
  thresholds live in `pool-reserve-data`; the `liquidation-manager` contract is
  the liquidation entry point. Contract identifiers and the live BTC-collateral
  vault contracts are pinned from Zest docs at build (Zest shipped Bitcoin
  collateral vaults in May 2026, so the surface is newer than the original
  research).
- **Stacks — Granite:** sBTC-collateral stablecoin borrowing, Leather-adjacent,
  with **soft / partial liquidations** — Granite only liquidates the minimum
  needed to bring a position back below its **Liquidation LTV**, rather than
  seizing 50–100% of collateral. Read collateral, debt and Liquidation LTV via
  Hiro `call-read`, normalize to `HealthPosition`.

**Arkadiko** (CDP vaults, **150% liquidation ratio**, 10% penalty; V2 collateral
STX / stSTX / sBTC) is the sequenced follow-on after Zest and Granite, not part
of the first slice.

### Normalized `HealthPosition` model

Every protocol adapter maps its native reads onto one domain shape (new schema
in `@stackr/models`, validated on egress like every other adapter output). The
card layer only ever sees this — never a protocol's raw fields:

```
HealthPosition {
  chain:                 Chain            // 'eth' | 'sol' | 'stx'
  protocol:              string           // 'aave-v3' | 'kamino' | 'zest' | 'granite'
  address:               string           // the watched account
  collateralValueUsd:    number
  debtValueUsd:          number
  // Normalized health, 0..1, where 1.0 = at the liquidation threshold.
  // Derived per protocol so cards compare like-for-like:
  //   Aave:    1 / healthFactor          (HF 2.0 -> 0.5)
  //   Zest:    (100 - HF) / 100 with the 1..100 scale, or LTV / liqLTV
  //   Granite: currentLtv / liquidationLtv
  //   Arkadiko: liquidationRatio / currentCollateralRatio
  liquidationRisk:       number           // 0..1, normalized; >= 1 == liquidatable
  // Native values preserved verbatim for display + audit (no lossy rounding):
  native: {
    healthFactor?:       number           // Aave 1e18-scaled or Zest 1..100
    ltv?:                number           // current LTV, fraction
    liquidationLtv?:     number           // threshold, fraction
    collateralRatio?:    number           // CDP ratio, fraction (Arkadiko)
  }
  oracle:                string           // which oracle the protocol liquidates against
  updatedAt:             string           // ISO timestamp
}
```

`liquidationRisk` is the single normalized scalar the UI sorts and colour-codes
on; `native` keeps each protocol's own number for the detail view and so a
normalization bug is auditable against the source.

### Refresh / caching model (free-tier-honest)

No background polling of rate-limited endpoints. Three mechanisms, matched to
what actually changes:

1. **Position composition** (collateral / debt amounts) changes only when the
   account transacts → refresh **on-demand** and on **address-activity events**
   (Alchemy address-activity / Helius / Hiro socket), with a slow TTL fallback.
   These are the expensive per-account reads, so they are never polled.
2. **Liquidation health** mostly moves because an **oracle price** moved, not
   because the user transacted. So for protocols where we read raw
   collateral/debt and compute HF ourselves (the Stacks ones, and Kamino if read
   raw), **stream prices over a free websocket** — Pyth Network publishes a free
   price WS and is the oracle these protocols liquidate against — and
   **recompute HF locally** in the browser (collateral × live price = arithmetic,
   zero load on rate-limited endpoints).
3. **Aave is the exception**: `getUserAccountData` returns the on-chain-computed
   HF directly, so one read-only call gives the live number — no price stream
   required for Aave.

This is the resolution of the "real-time vs free tiers" tension: on-demand +
activity-driven for positions, price-WS + local recompute for health.

## Consequences

**Positive**

- The liquidation USP rests on reads and math we own, on four protocols, behind
  one normalized shape. A vendor acquisition (cf. SimpleHash) cannot take it.
- The whole portfolio surface stays backend-free except one optional Zerion
  proxy: Alchemy allowlisting and keyless Kamino/Hiro reads need no server.
- One `HealthPosition` shape means cards across Aave / Kamino / Zest / Granite
  sort and colour-code identically, and adding a protocol is a single adapter.
- Refresh cost is bounded by design — expensive reads are event-driven, health
  is recomputed from a free price stream — so no free tier is at risk from
  "real-time".

**Negative / trade-offs**

- **Stacks is 100% bespoke and an ongoing maintenance cost.** Each protocol
  upgrade (e.g. a Zest contract-version bump, the new BTC-vault contracts) is our
  work. This is the largest engineering cost _and_ the largest differentiator —
  accepted deliberately.
- Per-protocol normalization is per-protocol risk: a wrong threshold or oracle
  mapping mis-states risk. Mitigated by preserving `native` values for audit and
  unit-testing the pure normalization functions (the 0012 pattern).
- The optional Zerion enrichment needs a proxy route (its key is a Basic-auth
  secret), so it is not pure-client-side — kept strictly as enrichment, never on
  the moat.
- Pinning exact endpoints/contract IDs (Kamino obligation endpoint, Zest/Granite
  contract identifiers) is deferred to build time against live docs, because
  these surfaces move; the ADR commits to the _approach_, not to addresses that
  could be stale by merge.

## Notes

### Verification (re-checked June 2026 against the issue #46 research)

- **Alchemy allowlist + Portfolio API:** confirmed. App-level allowlists
  (domain/referer, `*.domain` wildcard, applied immediately) cover REST Portfolio
  endpoints, not just JSON-RPC; CORS-supported for browser dApps. Free tier
  **30M CU/month, 500 CUPS** (the issue said only "generous", now pinned).
- **Zerion free tier:** **changed** — now **60,000 calls/month at 10 RPS**, not
  the 2,000/month the issue recorded (~30× more headroom). Auth is still an HTTP
  Basic **secret** key → a proxy is still required, but the "cache hard because
  only 2k" pressure is largely gone.
- **Kamino:** confirmed — public REST at `api.kamino.finance`, keyless, Swagger
  at `/documentation`, exposes position risk / LTV.
- **Aave v3 `getUserAccountData`:** confirmed signature and returns
  `(totalCollateralBase, totalDebtBase, availableBorrowsBase,
currentLiquidationThreshold, ltv, healthFactor)`; HF `1e18`-scaled, public/
  Alchemy RPC works client-side.
- **Zest:** confirmed — HF 1–100 (>100 = ∞, <1 liquidatable), borrow ≤50% LTV,
  liq at 70% +10% penalty; `liquidation-manager` / `pool-reserve-data` contracts.
  New since the issue: Bitcoin-collateral vaults shipped May 2026.
- **Granite:** confirmed — sBTC collateral, soft/partial liquidations to
  Liquidation LTV, Leather-adjacent, ~$26M TVL (Q1 2026, #2 on Stacks).
- **Arkadiko:** confirmed — 150% liquidation ratio, 10% penalty, V2 collateral
  STX/stSTX/sBTC.
- **Hiro:** confirmed — 50 rpm unauth / 500 rpm with key.
- **SimpleHash:** confirmed — acquired by Phantom (Feb 2025), standalone API
  sunset Mar 2025. Reinforces the no-vendor-coupling decision.

### First-slice build sequence (issue-sized)

1. `HealthPosition` schema + `HealthAdapter` port (`@stackr/models`, `services/ports.ts`).
2. Aave v3 adapter — single `getUserAccountData` read (lowest-risk, no oracle math).
3. Kamino adapter — keyless REST, pin obligation endpoint from Swagger.
4. Zest adapter — Hiro `call-read` + Clarity parse + HF normalization.
5. Granite adapter — Hiro `call-read` + soft-liquidation LTV normalization.
6. `useHealthPositions` query hook + on-demand/event refresh wiring (no polling).
7. Pyth price-WS + local HF recompute for the Stacks protocols.
8. Follow-on: Arkadiko adapter; optional Zerion value-card proxy + enrichment.

- Related ADRs: [0012](./0012-provider-anti-corruption-layer.md) (provider
  anti-corruption layer / key proxy), [0010](./0010-solana-wallet-stack.md),
  [0011](./0011-stacks-wallet-stack.md).
