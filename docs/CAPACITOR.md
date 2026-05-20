# Mobile (Capacitor)

Stackr's mobile app is a Capacitor native shell that loads the deployed
`https://stackr.ie` web app in a WebView (see
[ADR 0012](./DECISIONS/0012-capacitor-mobile-wrap.md)). It's **watch-only** —
wallet-connect is hidden on native because browser-extension wallets don't
exist in a WebView.

The web-side foundation (config, native-platform detection, watch-only gating)
is in the repo. The steps below generate and ship the native apps. They need a
**Mac with Xcode**, an **Apple Developer account** ($99/yr), and a **Google
Play Console account** ($25 one-time) — so they're run by hand, not in CI.

## One-time: add the native platforms

```bash
cd apps/web
pnpm add -D @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

This creates `apps/web/ios/` and `apps/web/android/` (both gitignored — they're
machine-specific and rebuilt locally).

## App icon + splash

```bash
cd apps/web
pnpm add -D @capacitor/assets
# Place a 1024x1024 icon at resources/icon.png and a splash at resources/splash.png
npx @capacitor/assets generate
```

## Sync after any web change

`server.url` means the WebView loads the live site, so most changes need no
native rebuild — just deploy the web app. Re-sync only when the Capacitor
config or plugins change:

```bash
cd apps/web
npx cap sync
```

## iOS → TestFlight

```bash
cd apps/web
npx cap open ios   # opens Xcode
```

In Xcode:

1. Select the project → Signing & Capabilities → set your Apple Developer team.
2. Bundle identifier is `ie.stackr.app` (from `capacitor.config.ts`).
3. Product → Archive.
4. Distribute App → App Store Connect → Upload.
5. In App Store Connect, add the build to **TestFlight → Internal Testing**.
   Internal testing needs no App Store review — testers get the invite link
   immediately.

## Android → Play internal track

```bash
cd apps/web
npx cap open android   # opens Android Studio
```

In Android Studio:

1. Build → Generate Signed Bundle / APK → Android App Bundle (`.aab`).
2. Create / select a signing key.
3. In Play Console → create the app → **Internal testing** → upload the `.aab`.
4. Add testers; the internal track link is live without full review.

## Notes

- Bundle ID / appId: `ie.stackr.app`. App name: `Stackr`. Both in
  `apps/web/capacitor.config.ts`.
- Public App Store / Play Store submission (full review) is a later step; the
  TestFlight + internal tracks are enough for a demo / interview link.
- If you later want an offline-capable build, switch from `server.url` to a
  bundled static export — that's a routing rework (the dynamic wallet route)
  and warrants a new ADR.
