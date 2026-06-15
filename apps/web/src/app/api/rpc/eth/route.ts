import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Same-origin JSON-RPC proxy for Ethereum.
 *
 * Goal: keep the Alchemy API key off the client. Previously the wagmi/viem
 * transports baked `NEXT_PUBLIC_ALCHEMY_API_KEY` into the browser bundle, where
 * anyone could read it — and Alchemy's domain allow-list only checks the
 * spoofable `Origin`/`Referer`, so it never actually prevented use of a leaked
 * key. This route reads a *server-only* `ALCHEMY_API_KEY` (no `NEXT_PUBLIC_`
 * prefix, so it is never bundled), forwards the request body upstream, and
 * returns the response same-origin.
 *
 * Fallback: when no key is configured the route forwards to the public mainnet
 * RPC (viem's default, `https://eth.merkle.io`) instead of failing. That keeps
 * local dev (no secret) and unconfigured deploys working, and means the client
 * only ever needs one endpoint — the proxy — regardless of whether a key exists.
 *
 * Abuse surface: a same-origin proxy in front of a metered upstream is an open
 * relay unless constrained, so requests are gated before anything is forwarded:
 * read-only JSON-RPC method allow-list, body-size cap, origin check, and a
 * best-effort per-IP rate limit. Upstream failures are mapped to a fixed error
 * contract instead of leaking upstream error bodies (which can echo the keyed
 * URL). This mirrors `apps/web/src/app/api/rpc/solana/route.ts`.
 */

// viem's `mainnet` default transport (`http()` with no URL) resolves to exactly
// this endpoint. Hardcoded so the worker route doesn't pull viem in just to
// compute a constant string, and so the proxy's no-key behaviour matches what
// the consumers used to do client-side.
const ETH_PUBLIC_RPC = 'https://eth.merkle.io';
const ALCHEMY_RPC = 'https://eth-mainnet.g.alchemy.com/v2';

const MAX_BODY_BYTES = 64 * 1024;
const MAX_BATCH_SIZE = 10;

// Read-only methods the app (wagmi mainnet transport, viem ENS client, and the
// Aave `getUserAccountData` read) legitimately needs. ENS resolution and the
// Aave read both bottom out in `eth_call` against the registry/resolver and
// Pool contracts, plus the chain/block bookkeeping viem issues around them.
// Write methods — notably eth_sendRawTransaction / eth_sendTransaction — are
// refused: stackr is watch-only and never submits transactions, so the proxy
// must not be usable as a relay for them.
const ALLOWED_METHODS = new Set([
  'eth_blockNumber',
  'eth_call',
  'eth_chainId',
  'eth_estimateGas',
  'eth_feeHistory',
  'eth_gasPrice',
  'eth_getBalance',
  'eth_getBlockByNumber',
  'eth_getBlockByHash',
  'eth_getCode',
  'eth_getLogs',
  'eth_getStorageAt',
  'eth_getTransactionByHash',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_maxPriorityFeePerGas',
  'net_version',
  'web3_clientVersion',
]);

// Best-effort sliding-window rate limit. Worker isolates each hold their own
// map, so this is a per-isolate ceiling rather than a global guarantee — a
// durable KV/DO-backed limit is the follow-up tracked in the hardening backlog.
const RATE_LIMIT_PER_MINUTE = 120;
const rateWindow = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, now: number): boolean {
  const entry = rateWindow.get(ip);
  if (!entry || entry.resetAt <= now) {
    if (rateWindow.size > 10_000) {
      rateWindow.clear();
    }
    rateWindow.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_PER_MINUTE;
}

function collectMethods(parsed: unknown): string[] | null {
  const calls: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
  if (calls.length === 0 || calls.length > MAX_BATCH_SIZE) {
    return null;
  }
  const methods: string[] = [];
  for (const call of calls) {
    if (typeof call !== 'object' || call === null || !('method' in call)) {
      return null;
    }
    const { method } = call;
    if (typeof method !== 'string') {
      return null;
    }
    methods.push(method);
  }
  return methods;
}

function rpcError(status: number, code: number, message: string): Response {
  return Response.json(
    { jsonrpc: '2.0', id: null, error: { code, message } },
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}

/**
 * Resolve the server-only Alchemy key.
 *
 * Production (Cloudflare Workers): the secret is bound on the worker `env`, read
 * via `getCloudflareContext`. Outside that runtime (plain `next dev`, Node,
 * tests) `getCloudflareContext` throws, so we fall back to `process.env`, which
 * picks up `.dev.vars` / `.env.local` locally.
 */
async function resolveAlchemyApiKey(): Promise<string | undefined> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (env?.ALCHEMY_API_KEY) return env.ALCHEMY_API_KEY;
  } catch {
    // Not running inside the Workers/OpenNext runtime — fall through.
  }
  return process.env.ALCHEMY_API_KEY;
}

export async function POST(request: Request): Promise<Response> {
  // Same-origin restriction: browsers send Origin on cross-origin (and all
  // CORS) requests; a mismatch means another site is using us as a free relay.
  const origin = request.headers.get('origin');
  if (origin !== null && origin !== new URL(request.url).origin) {
    return rpcError(403, -32000, 'cross-origin requests are not allowed');
  }
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite !== null && fetchSite !== 'same-origin' && fetchSite !== 'none') {
    return rpcError(403, -32000, 'cross-origin requests are not allowed');
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (isRateLimited(ip, Date.now())) {
    return rpcError(429, -32000, 'rate limit exceeded');
  }

  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) {
    return rpcError(413, -32000, 'request body too large');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return rpcError(400, -32700, 'invalid JSON');
  }

  const methods = collectMethods(parsed);
  if (methods === null) {
    return rpcError(400, -32600, 'invalid JSON-RPC request');
  }
  const refused = methods.find(method => !ALLOWED_METHODS.has(method));
  if (refused !== undefined) {
    return rpcError(403, -32601, `method not allowed by proxy: ${refused}`);
  }

  const apiKey = await resolveAlchemyApiKey();
  const upstream = apiKey ? `${ALCHEMY_RPC}/${apiKey}` : ETH_PUBLIC_RPC;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } catch {
    // Fixed contract: transport failures never leak upstream details.
    return rpcError(502, -32000, 'upstream unavailable');
  }

  if (!upstreamRes.ok) {
    // Upstream HTTP errors (4xx/5xx) are not forwarded verbatim either — their
    // bodies can echo the request URL, which for Alchemy carries the key.
    return rpcError(502, -32000, 'upstream error');
  }

  const payload = await upstreamRes.text();

  return new Response(payload, {
    status: upstreamRes.status,
    headers: {
      'Content-Type': 'application/json',
      // Signal which upstream served the request, WITHOUT leaking the key. Lets
      // the client (or a future health check) observe whether the proxy is
      // key-backed; `public` means we fell back to the public RPC.
      'x-stackr-rpc-upstream': apiKey ? 'alchemy' : 'public',
    },
  });
}
