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

// Security response headers (audit backlog). The CSP ships REPORT-ONLY first:
// the wallet stacks (RainbowKit / wallet-adapter / WalletConnect) load assets
// and open connections we don't fully enumerate yet, and an enforced CSP that
// guessed wrong would break connect flows in production. Tune from the
// console's violation reports, then move it to Content-Security-Policy.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `headers()` is unsupported (and ignored, with a build warning) under
  // `output: 'export'`, so the mobile target skips it; a native WebView has no
  // response headers anyway.
  ...(isCapacitor
    ? {}
    : {
        async headers() {
          return [{ source: '/(.*)', headers: securityHeaders }];
        },
      }),
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
