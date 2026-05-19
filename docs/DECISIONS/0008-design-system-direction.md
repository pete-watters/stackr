# 0008 — Design system direction: hand-rolled `@stackr/ui`, no dashboard libraries

- **Status:** Accepted
- **Date:** 2026-05-19

## Context

Stackr's UI is currently a mix of `@stackr/ui` components (hand-built on Radix headless primitives, styled with Tailwind v4) and ad-hoc page-level styling. With wallet-connect work imminent and a polish phase to follow, the question came up: should we adopt a dashboard library like [Tremor](https://tremor.so) (or shadcn's expanded charts/blocks) to ship "looks polished" faster, or extend the existing hand-rolled system?

The constraints:

- This codebase is a portfolio piece. The audience is hiring teams at wallet / trading companies who can recognise visual taste and craft on sight.
- Realtime data (orderbook, depth chart, price ticks) is core to the product. React-tree-driven chart libraries don't handle high-frequency updates well.
- Reference point: [Crypto View](https://github.com/pete-watters/crypto-view) — a previous hiring artifact built for Kraken. Terminal aesthetic, monospace number ladders, hand-drawn depth chart with green/red gradient fills, dense data, blazing fast. Recognisably its author's work.
- A bigger dependency surface (Tremor pulls in Recharts, several Radix packages, its own theming) costs build time, bundle size, and a piece of the visual identity in exchange for faster initial output.

## Decision

**Extend `@stackr/ui` as the design system. No dashboard libraries.** Specifically:

- **Visual primitives** (Card, Button, Badge, Input, Skeleton, Spinner, ChainAvatar, AddressDisplayer, CopyButton, Callout): hand-rolled in `@stackr/ui`, styled with Tailwind v4. Already present; extend as needed.
- **Behavior primitives** (Dialog, Tooltip, Dropdown, Select, Popover, Tabs): Radix headless primitives, styled by us. Already the pattern in `@stackr/ui`. Continue — hand-rolling accessibility wastes time and risks bugs.
- **Charts**: custom SVG via `@stackr/charts`. The performance argument is decisive for the orderbook and depth chart specifically — surgical `<path d>` updates outperform a re-rendering React tree on every tick. SVG also renders sharper than WebGL at the small sizes we need.
- **Number formatting / tickers**: hand-rolled, ~30 lines of code beats adding a dependency.

The visual north star is the Crypto View aesthetic: dark theme, monospace number ladders, dense data, distinctive crypto-trading-terminal feel. Stackr should evolve toward this look during the polish phase.

## Consequences

**Positive:**

- Smaller dependency surface, faster builds, smaller bundles. Lighthouse 95+ on all four axes becomes achievable.
- Charts can handle high-frequency realtime updates without re-render jank.
- Visual identity is owned and distinctive — every screen reads as ours, not as "another shadcn dashboard."
- Each new primitive is an opportunity to extend the design language coherently rather than fight a library's defaults.

**Negative:**

- More work per new component than reaching for a library.
- We carry the maintenance burden for accessibility on visual primitives (mitigated by Radix for behavior).
- A poorly executed hand-rolled component looks worse than a library default. Discipline matters.

**Closed off:**

- Tremor, MUI, Mantine, and similar "dashboard kit" libraries are out for Phase 1 and Phase 3 polish. If we ever revisit this, it warrants a superseding ADR.

## Notes

- The RainbowKit `<ConnectButton />` is acceptable as a temporary stand-in during the MetaMask connect work (#18) — it ships with wagmi and is hard to beat without effort. The unified connect modal (#21) replaces it with a hand-rolled `@stackr/ui` component so the three wallets feel cohesive.
- Performance budget: Lighthouse 95+ on all four axes on mobile is the bar.
- Reference: https://github.com/pete-watters/crypto-view
- Tracking issue: #26
