# 0012 — Provider anti-corruption layer and server-side key proxy

- **Status:** Accepted
- **Date:** 2026-06-10

## Context

`packages/services` holds one module per external data source (Blockstream,
Etherscan, Hiro, Solana RPC, CoinGecko, Kraken, Alpha Vantage). Two structural
weaknesses had accumulated:

1. **No runtime boundary.** Each module imported domain types from
   `@stackr/models` for the _return_ type, but the vendor JSON was only
   _cast_ (`as EtherscanBalanceResponse`) — a compile-time fiction with zero
   runtime checking. If a provider changed a field, renamed a key, or returned
   a rate-limit envelope where we expected data, the bad shape flowed straight
   through the type cast and surfaced later as a confusing render-time crash
   (`undefined is not a function`) far from the actual cause. The vendor's
   response interface was also the de-facto contract: there was nothing
   stopping a vendor-specific field from leaking into the app.

2. **A bundle-baked secret.** `apps/web/src/lib/solana-config.ts` read
   `NEXT_PUBLIC_HELIUS_API_KEY` and built the Helius RPC URL client-side. The
   `NEXT_PUBLIC_` prefix inlines the value into the browser bundle, so the key
   was readable by anyone who opened devtools.

The alternatives considered for (1) were: keep the casts and add ad-hoc
defensive checks per call site (rejected — scattered, unenforceable); validate
only at the React Query layer (rejected — too late, the vendor shape has
already spread); or formalize an anti-corruption layer (chosen). For (2):
leave it (rejected — leaks the key); proxy _all_ keyed providers (rejected —
the Alchemy keys are consumed by wagmi/viem _transports_, which are non-trivial
to proxy and out of scope); or proxy just the one cleanly-proxyable JSON-RPC
key (chosen).

## Decision

**Anti-corruption layer.** Introduce explicit provider _ports_ in
`packages/services/src/ports.ts` — `BalanceAdapter`, `PriceAdapter`,
`TransactionAdapter`, `StockAdapter`, `OrderBookAdapter` — expressed purely in
`@stackr/models` domain types. Every source module becomes an _adapter_ that
implements its port and validates at **both** boundaries with Zod, via a single
`parseOrThrow(schema, value, context)` helper:

- **Ingress:** the raw vendor payload is parsed against a private,
  module-local schema (e.g. `BlockstreamAddressSchema`) before we read a single
  field. The vendor shape never escapes the adapter.
- **Egress:** the normalized object is parsed against the `@stackr/models`
  schema (`BalanceSchema`, `TransactionSchema`, …) before it is returned, so a
  mapping bug in _our_ code is caught at the boundary too.

`parseOrThrow` throws a context-tagged error (`"btc.fetchBalance(ingress): …"`)
rather than returning a `Result`, because adapters run inside TanStack Query
`queryFn`s, which already model failure as a rejected promise. The per-chain
balance `switch` in `index.ts` is replaced by a `satisfies Record<Chain,
BalanceAdapter>` registry, so adding a chain without registering an adapter is a
compile error. `StockSearchResult`/`StockQuote` move to `@stackr/models` as
schemas (re-exported from services for back-compat). Pure normalization
functions (`normalizeBtcTransactions`, `normalizeCoinGeckoPrices`, …) are
extracted from the network calls so the mapping logic is unit-testable without
mocking `fetch`.

**Server-side key proxy.** Add an App Router route handler at
`apps/web/src/app/api/rpc/solana/route.ts` that reads a **server-only**
`HELIUS_API_KEY` (no `NEXT_PUBLIC_` prefix), forwards the JSON-RPC body to
Helius, and returns the response same-origin. The key is read via
`getCloudflareContext({ async: true }).env` on Workers, falling back to
`process.env` outside that runtime (plain `next dev`, Node, tests).
`solana-config.ts` points the `ConnectionProvider` at the same-origin proxy in
the browser, and at the public mainnet-beta cluster during SSR (where there is
no origin to build an absolute URL from).

The public-RPC fallback is **preserved server-side**: when no key is
configured, the route forwards to the public cluster instead of failing. This
keeps local dev (no secret) and unconfigured deploys working through a single
client endpoint, and avoids a client-side "probe then switch endpoints" dance
that would thrash the Solana connection. The route still signals which upstream
served a request via an `x-stackr-rpc-upstream: helius|public` header.

## Consequences

**Positive:**

- A provider that changes its response shape now fails loudly at the adapter
  boundary with a readable, context-tagged message, instead of corrupting app
  state. Swapping a vendor is a single-adapter change — the port, and every
  call site, are untouched.
- The Helius key is no longer in the client bundle.
- Normalization logic is pure and directly unit-tested (26 new service tests),
  independent of the network.

**Negative / trade-offs:**

- Every adapter now pays a Zod `safeParse` on each call. The payloads are
  small (a balance, ≤20 transactions, a ≤25-level orderbook), so the cost is
  negligible, but it is non-zero — notably the live Kraken WS frames run
  through `serializeOrderBook`'s egress parse on every tick.
- Two schemas per adapter (ingress + egress) is more code and a second place to
  update when a payload legitimately changes. This is the intended cost of the
  boundary.
- The proxy fixes only the Helius key. The Alchemy keys (wagmi transport in
  `wagmi-config.ts`, viem client in `ens-queries.ts`), the user-entered
  Etherscan/Alpha Vantage keys (localStorage settings-store), and
  `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` are intentionally left as-is.

## Notes

- `parseOrThrow` lives in `packages/services/src/validate.ts`; ingress schemas
  are private to each adapter module by design.
- `lookupStacksBnsName` degrades to `null` (rather than throwing) on a
  malformed payload, because it is best-effort UI sugar, not portfolio data.
- Manual follow-up for the proxy: `wrangler secret put HELIUS_API_KEY` for
  deploys, and copy `apps/web/.dev.vars.example` → `apps/web/.dev.vars` with a
  real key for local dev. Absent the secret, the proxy serves the public
  cluster.
- Related ADRs: [0010](./0010-solana-wallet-stack.md) (Solana wallet stack).
