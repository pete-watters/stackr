# Stackr

**A cross-chain Web3 portfolio for self-custodial holders.**

Track your real holdings across Bitcoin, Ethereum, Solana, and Stacks in one
view — connected wallets, watch-only addresses, and stablecoin positions
unified with live prices, depth-aware charts, DeFi health factors, and a
trading-terminal aesthetic built for people who actually use crypto.

🌐 **Live:** [stackr.ie](https://stackr.ie) _(coming soon)_

---

## What stackr is

Most portfolio trackers force a trade-off: hosted convenience with a KYC
wall, or DIY self-custody with no useful UI. Stackr is built on the premise
that the right answer is _self-custody by default, hosted nothing, beautiful
anyway_.

Connect MetaMask, Phantom, or Leather and your holdings render in seconds —
ETH, ERC-20s, SOL, SPL tokens, BTC, STX, Stacks fungibles, BNS names, ENS
names, stacking positions, FIAT-pegged stablecoins. Or add watch-only
addresses (cold storage, a partner's stack, a trading wallet) with custom
labels and groups. Everything is computed client-side from public chain RPCs;
no account, no database, no tracking pixels.

## Demo

A 60–90s walkthrough — land on the dashboard, connect MetaMask → Phantom →
Leather, watch the portfolio update across chains, toggle USD/EUR, and check a
DeFi health factor — is coming soon.

🎥 **Loom:** _(walkthrough recording coming soon)_

<!--
Drop the artifacts in and uncomment once they exist:

![Stackr — connected portfolio (desktop)](./docs/media/portfolio-desktop.png)
![Stackr — portfolio (mobile, 375px)](./docs/media/portfolio-mobile.png)
-->

## Features

- **Liquidation-risk monitoring** — the headline: DeFi _health factors_ at a
  glance, so a borrower sees _am I about to get liquidated?_ before the market
  does. Starts with Aave v3 (Ethereum); expanding to Kamino (Solana) and
  Zest/Granite (Stacks). Read protocol-native, never from a black-box
  aggregator.
- **Multi-chain by default** — Bitcoin, Ethereum, Solana, Stacks. Stable
  coins and FIAT-pegged tokens treated as first-class citizens.
- **Connected + watch-only unified** — your hardware wallet, your hot wallet,
  and your partner's address all in one portfolio view.
- **Realtime market data** — Kraken-backed orderbook + depth chart, live
  price ticks, hand-rolled SVG charts that don't choke on 10+ updates/sec.
- **ENS / `.sol` / `.btc` resolution** — names where addresses would normally
  blur into noise.
- **EUR + USD** — because Dublin.
- **No accounts, no analytics, no PII** — watch-only addresses live in
  `localStorage`. Connected wallets are auth + address-discovery only;
  stackr never signs transactions.
- **Mobile-first** — designed for 375px and up; native iOS + Android builds
  via Capacitor.

## Tech

Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind v4 ·
TanStack Query · Zustand · wagmi + viem · `@solana/wallet-adapter` ·
`@stacks/connect` · custom SVG charts · pnpm workspaces · Turborepo ·
Cloudflare Workers (`@opennextjs/cloudflare`).

## Status

Active development. The wallet-connect layer, multi-chain data layer, and
charting library are in place. See open [issues](https://github.com/pete-watters/stackr/issues)
for what's next.

## Local development

See [SETUP.md](./SETUP.md) for prerequisites, install, and common commands.

## License

Proprietary — All Rights Reserved. See [LICENSE](./LICENSE).

Built and maintained by [Pete Watters](https://github.com/pete-watters) in Dublin.
