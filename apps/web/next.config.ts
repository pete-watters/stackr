import type { NextConfig } from 'next';
import path from 'node:path';

// Mobile (Capacitor) build target. Driven by `NEXT_PUBLIC_TARGET=capacitor`
// (set by the `build:mobile` script). When the flag is absent the config below
// is the plain web build — byte-for-byte identical to before this flag existed.
const isCapacitor = process.env.NEXT_PUBLIC_TARGET === 'capacitor';

// Modules swapped out for watch-only stubs in the mobile build. Mobile is
// watch-only by design (no wallet-connect, no signing), and these modules pull
// in wagmi / RainbowKit / WalletConnect / Solana wallet-adapter / @stacks/connect
// — several of which touch browser/native globals at module scope and break the
// static export. Replacing the modules (rather than runtime-gating their render)
// keeps those libraries out of the mobile bundle and out of the export prerender.
const capacitorModuleStubs: Array<[RegExp, string]> = [
  [/^@\/lib\/providers$/, 'src/lib/providers.capacitor.tsx'],
  [/^@\/components\/wallet-connect-modal$/, 'src/components/wallet-connect-modal.capacitor.tsx'],
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Capacitor ships a static bundle inside a native WebView, so the mobile
  // target switches Next to a static export (`./out`, consumed via
  // capacitor.config.ts `webDir`). The default web build (OpenNext on
  // Cloudflare) keeps its server-rendered output untouched.
  ...(isCapacitor
    ? {
        output: 'export' as const,
        // The static export has no Image Optimization server.
        images: { unoptimized: true },
        webpack: (
          config: { plugins: unknown[] },
          { webpack }: { webpack: typeof import('webpack') },
        ) => {
          for (const [pattern, target] of capacitorModuleStubs) {
            config.plugins.push(
              new webpack.NormalModuleReplacementPlugin(
                pattern,
                path.resolve(import.meta.dirname, target),
              ),
            );
          }
          return config;
        },
      }
    : {}),
};

export default nextConfig;
