# 0012 — Mobile: Capacitor wrap of the web app (watch-only)

- **Status:** Proposed
- **Date:** 2026-05-22

## Context

Stackr needs a mobile presence for the interview demo (a TestFlight / Play
internal-track install link). A second native codebase (the removed Expo
scaffold) is not worth maintaining for what is, on mobile, a read-only view of
the same portfolio. The web app is already a polished, responsive PWA.

Constraints:

- The web app deploys as a server-rendered Worker via `@opennextjs/cloudflare`.
  Capacitor, by contrast, ships a **static bundle** inside a native WebView — it
  needs `next build` with `output: 'export'` producing `./out`.
- Wallet-connect (wagmi / RainbowKit / WalletConnect / Solana adapters) is **not
  wanted on mobile** (watch-only, no signing) and several of those libraries
  touch browser-only/native APIs that don't survive static export cleanly.
- Two routes/áreas are incompatible with `output: 'export'` as written:
  the dynamic, user-data-driven route `/wallet/[chain]/[address]` (server-rendered),
  and the wallet-connect provider stack in `src/lib/providers.tsx`.

Alternatives considered: a separate React Native app (rejected — duplicate
codebase for a watch-only view); a pure PWA "Add to Home Screen" (rejected — no
store presence, weaker as an interview artifact than a real TestFlight build).

## Decision

Wrap the existing Next.js web app with **Capacitor**, served as a **watch-only**
static export. The web (Cloudflare/OpenNext) build is the source of truth and is
left untouched; the mobile build is an additive, env-flagged target.

- `appId: ie.stackr.app`, `appName: Stackr`, `webDir: out` (`apps/web/capacitor.config.ts`).
- A `NEXT_PUBLIC_TARGET=capacitor` build flag drives, in `next.config.ts`,
  `output: 'export'` **only** for the mobile target — the default web build is
  byte-for-byte unchanged.
- Under that flag, swap `Providers` to a **watch-only** set (drop wagmi /
  RainbowKit / WalletConnect / Solana) and hide the wallet-connect UI; the
  watch-only address-management flow stays fully functional.
- The dynamic `/wallet/[chain]/[address]` route must become client-routed for
  the mobile target (a catch-all client page or query-param view) so the static
  export succeeds.
- Native platforms (`ios/`, `android/`) are added with `npx cap add` and are
  gitignored except essentials (icons, splash, Info.plist, signing stubs).

## Consequences

**Positive:**

- One codebase. Mobile is the web app's watch-only flow inside a WebView.
- Fast route to a shareable artifact: TestFlight (internal) + Play internal track
  give install links in days, not the weeks a public store review takes.
- No new chain/data code — `packages/{models,queries,services,charts,ui}` are reused as-is.

**Negative / blockers to clear before a mobile build is green:**

- `output: 'export'` will **fail** until the dynamic wallet route is client-routed
  for the mobile target. This is the first real task, not a config toggle.
- Provider gating behind the target flag is required so the wallet libraries don't
  break the export (and because mobile is watch-only by design).
- Store submission needs **paid accounts**: Apple Developer ($99/yr) and Google
  Play Console ($25 one-time) — these steps are owner-only.
- `cap add ios/android` needs **Xcode** and **Android Studio** installed locally.

## Notes

- **Status: Proposed** — foundation started on branch `feat/capacitor-mobile`:
  Capacitor deps (`@capacitor/core|cli|ios|android`) + `capacitor.config.ts` + this
  ADR. The build-target wiring, route conversion, and provider gating are the next
  steps (see `.private/roadmap.md`).
- Scope cap (from the project plan): **no wallet-connect on mobile, no signing.**
  Wallet adapters live only in the web build.
- Related ADRs: [0008](./0008-design-system-direction.md),
  [0009](./0009-wallet-connect-architecture.md).
