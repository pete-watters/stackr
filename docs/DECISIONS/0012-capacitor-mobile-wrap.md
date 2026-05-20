# 0012 — Mobile via Capacitor wrapping the deployed web app

- **Status:** Accepted
- **Date:** 2026-05-20

## Context

Stackr needs a mobile presence — a TestFlight / Play-internal build is a strong interview artifact ("here's the same product on iOS"). The options:

1. **Native React Native (Expo)** — a separate app sharing the framework-agnostic packages. High effort: the UI (`@stackr/ui`, Tailwind, Radix) is web-only and would need a parallel `@stackr/ui-native`. Multi-week. (The original `apps/mobile` Expo scaffold was removed in #17 for this reason.)
2. **Capacitor wrapping a static export** (`output: 'export'`) — bundles the web build into a native WebView. Offline-capable, but blocked by Stackr's dynamic route `/wallet/[chain]/[address]` (server-rendered; static export can't enumerate arbitrary addresses) and its client-only data layer. Would require reworking routing.
3. **Capacitor wrapping the deployed web app via `server.url`** — the native shell loads the live `https://stackr.ie` in a WebView. No static export, no routing changes. Requires a network connection.

## Decision

Use **option 3** for v1: Capacitor with `server.url` pointing at the live deployment. `apps/web/capacitor.config.ts` holds the config (`appId: ie.stackr.app`, `appName: Stackr`).

This is the fast, low-risk path to a shippable mobile build — matching the project's "demo-able over architecturally pure" trade-off. Offline support is the obvious upgrade path (option 2) if mobile becomes a real product surface; it warrants its own ADR then.

**Mobile is watch-only.** Browser-extension wallets (MetaMask, Phantom, Leather) don't exist inside a WebView, so connecting them is impossible on native. The wallet-connect UI is therefore hidden when running natively, detected via `useIsNativePlatform()` (`Capacitor.isNativePlatform()`), gated _inside_ `WalletConnectModal` and `ChainStatusIndicators` (not in the header, to keep that surface stable). The watch-only address flow — the genuinely useful core — works fully on mobile.

## Consequences

**Positive:**

- Days, not weeks, to a TestFlight / Play-internal build. No routing rework, no parallel native UI.
- The mobile app is always in sync with the web deploy — one codebase, one deploy.
- `useIsNativePlatform()` cleanly degrades the experience to watch-only without forking components.

**Negative:**

- Requires a network connection at launch (no offline mode). Acceptable for a demo; the `capacitor/www/index.html` fallback only shows a connecting state.
- App Store review can be sensitive to apps that are "just a website in a webview." Mitigation: the watch-only portfolio is genuinely app-like (local storage, native shell, icon/splash); TestFlight + Play **internal** tracks don't require public review anyway.
- The native project folders (`apps/web/ios/`, `apps/web/android/`) are generated locally and gitignored — they're rebuilt per machine and carry machine-specific signing.

## Notes

- Build + submission steps (need a Mac with Xcode, an Apple Developer account, and a Play Console account — all Pete's) are in `docs/CAPACITOR.md`.
- Tracking issue: #23.
- Related: ADR 0009 (wallet-connect is web-only auth/address-discovery), 0008 (hand-rolled UI).
