import { absoluteUrl, isProductionHost, isProductionSiteUrl, resolveSiteUrl } from '@/lib/site';

/**
 * The robots.txt body, built by hand.
 *
 * `MetadataRoute.Robots` — Next's `app/robots.ts` convention — models exactly
 * `User-agent` / `Allow` / `Disallow` / `Sitemap` / `Host` / `Crawl-delay` and
 * has no escape hatch for an arbitrary directive, so it cannot emit the
 * `Content-Signal:` line at all. Emitting the file ourselves is the only way to
 * ship Content Signals, and it also lets the body branch on whether this
 * deployment is production.
 *
 * Content Signals (Cloudflare's robots.txt extension) express *usage* intent,
 * which `Allow`/`Disallow` cannot: crawl the pages, index them, answer live
 * questions from them — but do not train on them. Like robots.txt itself it is
 * advisory, honoured voluntarily.
 */

/**
 * Machine-facing or private surfaces. Mirrors the per-route
 * `robots: { index: false, follow: false }` metadata so the two never disagree:
 * robots.txt withholds the crawl, the meta tag withdraws the index.
 */
const DISALLOWED_PATHS = [
  '/api/',
  '/settings',
  '/account',
  '/login',
  '/auth/',
  '/labs',
  '/wallet/',
];

/**
 * `/wallet/` blocks the unbounded address-keyed detail routes, but `/wallet/add`
 * is a real public page. Google resolves a conflict by longest match, so the
 * more specific `Allow` wins; it is listed explicitly rather than relied on
 * implicitly.
 */
const ALLOWED_PATHS = ['/', '/wallet/add'];

/**
 * Build the robots.txt body.
 *
 * `indexable` false is the preview/staging case. Cloudflare *Pages* stamps
 * `X-Robots-Tag: noindex` onto branch previews automatically; Cloudflare
 * *Workers* — which is what Stackr deploys to — does not, so a preview Worker
 * is fully crawlable unless we say otherwise here.
 */
export function buildRobotsTxt(siteUrl: string, indexable: boolean): string {
  if (!indexable) {
    return [
      '# Non-production deployment. Nothing here should be indexed, cited, or trained on.',
      'User-agent: *',
      'Content-Signal: search=no, ai-input=no, ai-train=no',
      'Disallow: /',
      '',
    ].join('\n');
  }

  return [
    '# Content Signals Policy — https://developers.cloudflare.com/ai-crawl-control/',
    '# search: search engines building an index and showing links/excerpts',
    '# ai-input: real-time use in generative AI answers (e.g. RAG)',
    '# ai-train: use as training/fine-tuning data',
    'User-agent: *',
    'Content-Signal: search=yes, ai-input=yes, ai-train=no',
    ...ALLOWED_PATHS.map(path => `Allow: ${path}`),
    ...DISALLOWED_PATHS.map(path => `Disallow: ${path}`),
    '',
    `Sitemap: ${absoluteUrl('/sitemap.xml', siteUrl)}`,
    '',
  ].join('\n');
}

/**
 * The host this request arrived on. `x-forwarded-host` wins when a proxy set it,
 * then the `Host` header, then whatever the framework put in `request.url` —
 * which under OpenNext is not guaranteed to carry the original scheme, hence
 * host rather than origin.
 */
export function resolveRequestHost(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-host');
  if (forwarded !== null && forwarded.length > 0) {
    const [first] = forwarded.split(',');
    return (first ?? '').trim();
  }

  const host = request.headers.get('host');
  if (host !== null && host.length > 0) return host;

  return new URL(request.url).host;
}

/**
 * A deployment counts as production only when both halves agree: the host the
 * request arrived on, and the site URL this build was made for.
 *
 * Neither alone is sufficient. The host catches a preview Worker built without
 * `NEXT_PUBLIC_SITE_URL` set — but it is not always the client's host: under
 * OpenNext on Workers, a configured custom-domain route rewrites `Host` and
 * `x-forwarded-host` to that domain (reproducible with `wrangler dev`, where a
 * request to localhost arrives claiming `stackr.ie`). So the build-time site URL
 * is the control that must be set on a preview deployment, and the host check is
 * the safety net that catches a preview the env var missed.
 */
export function isIndexableDeployment(request: Request): boolean {
  return isProductionHost(resolveRequestHost(request)) && isProductionSiteUrl(resolveSiteUrl());
}
