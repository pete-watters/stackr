import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Same-origin JSON-RPC proxy for Solana.
 *
 * Goal: keep the Helius API key off the client. Today `solana-config.ts` baked
 * `NEXT_PUBLIC_HELIUS_API_KEY` into the browser bundle, where anyone could read
 * it. This route reads a *server-only* `HELIUS_API_KEY` (no `NEXT_PUBLIC_`
 * prefix, so it is never bundled), forwards the request body upstream, and
 * returns the response same-origin.
 *
 * Fallback: when no key is configured the route forwards to the public
 * mainnet-beta cluster instead of failing. That keeps local dev (no secret) and
 * unconfigured deploys working, and means the client only ever needs one
 * endpoint — the proxy — regardless of whether a key exists.
 */

// `clusterApiUrl('mainnet-beta')` from @solana/web3.js resolves to exactly this
// URL. Hardcoded so the worker route doesn't pull the web3.js bundle in just to
// compute a constant string.
const SOLANA_PUBLIC_RPC = 'https://api.mainnet-beta.solana.com';
const HELIUS_RPC = 'https://mainnet.helius-rpc.com';

/**
 * Resolve the server-only Helius key.
 *
 * Production (Cloudflare Workers): the secret is bound on the worker `env`, read
 * via `getCloudflareContext`. Outside that runtime (plain `next dev`, Node,
 * tests) `getCloudflareContext` throws, so we fall back to `process.env`, which
 * picks up `.dev.vars` / `.env.local` locally.
 */
async function resolveHeliusApiKey(): Promise<string | undefined> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (env?.HELIUS_API_KEY) return env.HELIUS_API_KEY;
  } catch {
    // Not running inside the Workers/OpenNext runtime — fall through.
  }
  return process.env.HELIUS_API_KEY;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = await resolveHeliusApiKey();
  const upstream = apiKey ? `${HELIUS_RPC}/?api-key=${apiKey}` : SOLANA_PUBLIC_RPC;

  const body = await request.text();

  const upstreamRes = await fetch(upstream, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const payload = await upstreamRes.text();

  return new Response(payload, {
    status: upstreamRes.status,
    headers: {
      'Content-Type': 'application/json',
      // Signal which upstream served the request, WITHOUT leaking the key. Lets
      // the client (or a future health check) observe whether the proxy is
      // key-backed; `absent` means we fell back to the public cluster.
      'x-stackr-rpc-upstream': apiKey ? 'helius' : 'public',
    },
  });
}
