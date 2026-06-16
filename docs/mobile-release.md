# Mobile release runbook (Capacitor → TestFlight + Play)

How Stackr's mobile wrap is built and shipped. The app is a **watch-only**
Capacitor wrap of the web build (ADR
[0014](DECISIONS/0014-capacitor-export-mode.md)); there is no signing inside the
app, only store distribution.

Automation lives in:

- `apps/web/fastlane/` — Fastlane lanes (`Fastfile`, `Appfile`, `Matchfile`,
  `Pluginfile`) and `apps/web/Gemfile`.
- `.github/workflows/mobile-release.yml` — the CD workflow.

This pipeline is **separate from the web deploy**. The web app ships via
Cloudflare Workers Builds on push to `main`; `mobile-release.yml` has no
`pull_request` or branch trigger and never touches that path.

## Pipeline at a glance

`workflow_dispatch` (or a `mobile-v*` tag) →
`NEXT_PUBLIC_TARGET=capacitor pnpm --filter @stackr/web build:mobile` (static
export to `apps/web/out`) → `npx cap sync` → Fastlane:

- **iOS** (`fastlane ios beta`): App Store Connect API-key auth → optional
  `match` signing → `build_app` (gym) → `pilot` upload to TestFlight. A second
  lane, `fastlane ios release`, runs `deliver` for App Store metadata/submission.
- **Android** (`fastlane android internal`): `gradle` release bundle → `supply`
  upload to the Play internal track as a draft.

Each lane no-ops with a clear message if its native project folder is absent, so
the scaffold is safe to run before `cap add`.

## Owner one-time setup

These need a Mac and paid store accounts; they cannot be automated here.

1. **Generate the native projects** (on a Mac, from `apps/web`):

   ```bash
   pnpm --filter @stackr/web build:mobile   # produces apps/web/out
   npx cap add ios
   npx cap add android
   npx cap sync
   ```

   You may optionally commit `apps/web/ios/` and `apps/web/android/` for signing
   stability; otherwise CI regenerates them with `cap add` when they are absent.
   Build artifacts inside them (CocoaPods `Pods/`, Gradle `build/`) are
   git-ignored.

2. **Icons / splash** via `@capacitor/assets`:

   ```bash
   npx @capacitor/assets generate
   ```

3. **Apple**: join the Apple Developer Program ($99/yr), create the
   `ie.stackr.app` app record in App Store Connect, and create an **App Store
   Connect API key** (Users and Access → Integrations → keys). Note the Key ID,
   Issuer ID, and download the `.p8` once.

4. **iOS signing** — choose one:
   - **match** (recommended): create a PRIVATE repo (e.g.
     `pete-watters/stackr-match`), then on a Mac run
     `bundle exec fastlane match appstore` to seed certs + profiles. Set
     `MATCH_GIT_URL` + `MATCH_PASSWORD` as secrets.
   - **manual**: install the distribution cert + provisioning profile on the
     build machine and leave `MATCH_GIT_URL` unset (the Fastfile guard skips
     match).

5. **Google Play**: pay the one-time $25 registration, create the
   `ie.stackr.app` app, and create a **service account** (Play Console → API
   access) with the JSON key. Wire a release `signingConfig` in
   `apps/web/android/app/build.gradle` that reads the `ANDROID_*` env values.

6. **First upload is manual.** Both stores require an initial build/record to
   exist before `pilot`/`supply` can push to it. Do the first TestFlight and
   first Play internal upload by hand, then CI takes over.

## GitHub Actions secrets

Set these under repo Settings → Secrets and variables → Actions. None are
committed; the Fastlane config and workflow reference them by name only.

| Secret                              | Used by         | What it is                                        |
| ----------------------------------- | --------------- | ------------------------------------------------- |
| `APP_STORE_CONNECT_API_KEY_ID`      | iOS             | Key ID of the App Store Connect API key           |
| `APP_STORE_CONNECT_API_ISSUER_ID`   | iOS             | Issuer ID for that key                            |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | iOS             | The `.p8` file body, **base64-encoded**           |
| `MATCH_GIT_URL`                     | iOS (match)     | HTTPS URL of the private match repo               |
| `MATCH_PASSWORD`                    | iOS (match)     | Passphrase that decrypts the match repo           |
| `PLAY_SERVICE_ACCOUNT_JSON`         | Android         | Full Play service-account JSON (passed to supply) |
| `ANDROID_KEYSTORE_BASE64`           | Android signing | Upload keystore, base64-encoded                   |
| `ANDROID_KEYSTORE_PASSWORD`         | Android signing | Keystore password                                 |
| `ANDROID_KEY_ALIAS`                 | Android signing | Key alias                                         |
| `ANDROID_KEY_PASSWORD`              | Android signing | Key password                                      |

## Triggering a release

- **Manual**: Actions → **Mobile Release** → Run workflow. Pick `platform`
  (`ios` / `android` / `both`) and the Android `track` (`internal` by default).
- **Tag**: push a `mobile-v*` tag (e.g. `mobile-v1.0.0`) to release both
  platforms.

The iOS job runs on `macos-14`; the Android job on `ubuntu-latest`.

## Optional: Firebase App Distribution (not wired)

For beta builds to non-store testers, Fastlane has
`fastlane-plugin-firebase_app_distribution`. It is documented here but
intentionally not enabled. To add it: uncomment the gem in `apps/web/Gemfile`
and the line in `apps/web/fastlane/Pluginfile`, run `bundle install`, then add a
lane calling `firebase_app_distribution`. This is a beta channel, not a store
release.
