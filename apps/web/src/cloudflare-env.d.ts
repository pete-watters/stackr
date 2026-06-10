// Augments the Cloudflare Workers env (declared by @opennextjs/cloudflare) with
// stackr's server-only secrets, so `getCloudflareContext().env.HELIUS_API_KEY`
// is typed at the proxy route. HELIUS_API_KEY is server-only (no NEXT_PUBLIC_
// prefix) and is provisioned with `wrangler secret put HELIUS_API_KEY`.
declare global {
  interface CloudflareEnv {
    HELIUS_API_KEY?: string;
  }
}

export {};
