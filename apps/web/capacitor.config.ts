import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ie.stackr.app',
  appName: 'Stackr',
  // Capacitor ships the static export produced by the mobile build target
  // (`NEXT_PUBLIC_TARGET=capacitor` → Next `output: 'export'` → ./out).
  // The web build (OpenNext on Cloudflare) is unaffected and does not use this.
  webDir: 'out',
};

export default config;
