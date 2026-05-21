# 0014 — Portfolio data architecture: client-side providers + refresh model

- **Status:** Proposed
- **Date:** 2026-05-21

## Context

stackr's next surface is **real-time balances + activity + DeFi position
cards**, with the differentiating feature being **liquidation-risk
monitoring** — a fund manager checking on the go "am I about to get liquidated
on Granite/Zest, and what's my Aave health factor?". The hard constraint is
**free / generous-free-tier, client-side, no backend** (watch-only data lives
in the browser; connected wallets are auth + address-discovery only).

The research in issue #46 reached one headline finding:

- **No single provider covers {balances + activity + NFTs + DeFi} across all
  four chains**, and aggregators expose position _value_, not a normalized
  liquidation _health_ field. So the liquidation USP **cannot be bought
  off-the-shelf** — it must be built per-protocol on native reads. That is
  exactly why it is defensible. **Stacks has zero aggregator coverage**, so it
  is fully bespoke — the moat, not just a gap.

This ADR records the data-layer architecture. ADR 0013 already commits the
first liquidation slice (Aave v3); this ADR is its broader companion: the
portfolio-surface provider choice and the cross-chain refresh model.

## Decision

Two tracks, both backend-free where possible.

### Track A — Portfolio surface (balances / activity / NFTs / prices)

- **EVM + Solana:** lead with **Alchemy Portfolio/Token API** — the only
  option that is genuinely client-side-safe via **domain allow-listing** (the
  key is locked to our origin and CORS-restricted), with generous free compute
  units.
- **Stacks:** **Hiro Stacks Blockchain API** directly — the only source for STX
  balances/activity (a Hiro key lifts the rate limit to 500 rpm).
- **Bitcoin:** no L1 DeFi; the "BTC DeFi" story is really the **sBTC / Stacks**
  story under Track B.
- **Richer normalized DeFi _value_ cards (later):** add **Zerion** (8,000+
  protocols, one schema) behind a **thin Cloudflare Worker** (a single edge
  function, not a real backend) because its key is a secret. Its free tier is
  ~2,000 req/month, so cache hard. Treated as an additive enhancement, not a
  v1 dependency.
- **Ruled out:** DeBank (no free tier), SimpleHash (sunset Mar 2025), Covalent
  / Moralis / Birdeye (weaker fit / tighter free limits).

### Track B — Liquidation health (the USP), protocol-native reads

Read liquidation health **directly from each protocol** rather than through an
aggregator (rationale and the Aave-first slice are in ADR 0013):

- **EVM:** Aave v3 `Pool.getUserAccountData(user)` → on-chain-computed
  `healthFactor` + `ltv` + `currentLiquidationThreshold` in one free read-only
  call via our own RPC. Then Compound v3 / Spark (bespoke ABIs).
- **Solana:** **Kamino** public REST (`api.kamino.finance`, no key) for
  LTV / liquidation-LTV; MarginFi + Save via open TS SDKs.
- **Stacks (the moat, fully bespoke):** `POST /v2/contracts/call-read/...` on
  Hiro per protocol, parse Clarity, wire each protocol's oracle, compute
  HF/LTV ourselves. Sequence **Zest → Granite → Arkadiko**.

A chain-agnostic risk mapper turns any computed health factor into
`safe | caution | danger` (ADR 0013), so every protocol funnels through one
presentation path.

### Refresh model (resolved by Pete on #46)

Match the mechanism to what actually changes — **no background polling of
rate-limited paid endpoints**:

1. **Position composition** (collateral/debt amounts) → refreshed on
   **address-activity websocket/webhook** (Helius for SOL, Alchemy
   address-activity, Hiro socket for STX) plus a slow TTL. Pushes on change, so
   expensive per-account reads only fire when the address moves.
2. **Liquidation health** → driven by the **oracle price**, not your tx. Stream
   prices over a websocket (we already run a Kraken WS; **Pyth Network** has a
   free price WS and is the oracle these protocols liquidate against, so a
   locally-computed HF matches reality) and **recompute HF in the browser**
   (collateral × live price = arithmetic). Real-time alerts, zero load on
   metered endpoints.
3. **Aave exception:** `getUserAccountData` returns the on-chain-computed HF
   directly, so Aave needs no price stream — one read-only call gives the live
   value. The price-stream + local-recompute pattern is for protocols where we
   read raw collateral/debt (Stacks).

### First-ship slice

**Aave v3 (EVM) + Kamino (SOL) + Zest & Granite (STX)** — fully answers "am I
about to get liquidated on Granite/Zest, and what's my Aave health factor?".

## Consequences

**Positive:**

- Fully client-side for v1: Alchemy domain allow-listing + protocol-native RPC
  reads need no backend. Only the optional Zerion value-cards path adds a thin
  Worker.
- The liquidation moat sits on protocol-native reads we control — not coupled
  to any aggregator (SimpleHash vanished in 12 months; provider churn is real).
- Stacks has zero aggregator coverage, so bespoke reads are simultaneously the
  largest engineering cost and the largest differentiator.

**Negative / commitments:**

- **Stacks is 100% bespoke and ongoing maintenance** — each protocol upgrade
  (e.g. Zest contract version bumps) is our cost.
- "Real-time" must mean **on-demand refresh + websocket push + aggressive
  caching**, never background polling — every free tier punishes polling
  (Zerion ~2k/mo, Birdeye 30k CU/mo, Hiro 50–500 rpm).
- **CORS / key exposure:** Zerion/DeBank keys are secrets and need a proxy,
  which dents the pure-client-side story; Alchemy domain allow-listing is the
  backend-free path — must verify it covers the exact Portfolio endpoints used.

## Open decisions for Pete

These were the unchecked items on #46; recorded here so they travel with the
ADR. Flip Status to **Accepted** once confirmed.

- [ ] Confirm **Alchemy + domain allow-listing** as the EVM/SOL portfolio
      engine (vs accepting a thin Worker proxy for Zerion), and verify allow-listing
      covers the Portfolio endpoints we call.
- [ ] Confirm the **first-ship protocol set**: Aave v3 + Kamino + Zest + Granite.
- [ ] Accept that **Stacks liquidation cards are bespoke per protocol** (no
      shortcut) — sequence Zest → Granite → Arkadiko.
- [x] Caching/refresh model — **resolved**: activity-websocket for positions,
      Pyth price-websocket + local recompute for health, no background polling.

## Notes

- Full research and source docs: issue #46 (Aave `getUserAccountData`, Kamino
  API, Hiro `call-read` + rate limits, Zest / Granite / Arkadiko docs, Alchemy
  Portfolio free tier + domain allow-listing, Zerion API auth).
- First liquidation slice and the risk-mapper pattern: ADR
  [0013](./0013-defi-liquidation-health.md).
- Non-goal: this does not commit us to Zerion — it is an optional enhancement
  for normalized value cards only, gated behind a future thin Worker.
