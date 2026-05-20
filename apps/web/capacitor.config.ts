import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor wraps the deployed web app in a native iOS/Android shell.
 *
 * v1 strategy: `server.url` points the WebView at the live deployment rather
 * than bundling a static export. Stackr's dynamic routes (e.g.
 * `/wallet/[chain]/[address]`) and fully client-side data layer make a static
 * `output: 'export'` non-trivial; loading the hosted app is the fast,
 * low-risk path to TestFlight / Play internal. The trade-off (requires a
 * network connection, not offline-capable) is acceptable for a demo. See
 * docs/DECISIONS/0012-capacitor-mobile-wrap.md.
 *
 * On native, wallet-connect is hidden (browser-extension wallets don't exist
 * in a WebView) — the mobile app is watch-only. That gating lives in the
 * WalletConnectModal / ChainStatusIndicators components via
 * `useIsNativePlatform`.
 */
const config: CapacitorConfig = {
  appId: 'ie.stackr.app',
  appName: 'Stackr',
  // Fallback bundle dir. With server.url set, the WebView loads the live site;
  // this is only used if the remote URL is unreachable at launch.
  webDir: 'capacitor/www',
  server: {
    url: 'https://stackr.ie',
    cleartext: false,
  },
};

export default config;
