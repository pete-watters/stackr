import { describe, expect, it } from 'vitest';
import { buildRobotsTxt, isIndexableDeployment } from './robots-txt';

/**
 * The emitted body is the contract — a crawler reads bytes, not a
 * `MetadataRoute.Robots` object — so these assertions are on the text itself.
 */
describe('buildRobotsTxt (production)', () => {
  const body = buildRobotsTxt('https://stackr.ie', true);
  const lines = body.split('\n');

  it('ships the Content Signals policy: indexable and answerable, not trainable', () => {
    expect(lines).toContain('User-agent: *');
    expect(lines).toContain('Content-Signal: search=yes, ai-input=yes, ai-train=no');
  });

  it('keeps machine-facing and private routes out', () => {
    ['/api/', '/settings', '/account', '/login', '/auth/', '/labs', '/wallet/'].forEach(path => {
      expect(lines).toContain(`Disallow: ${path}`);
    });
  });

  it('re-allows the public /wallet/add page inside the disallowed /wallet/ prefix', () => {
    expect(lines).toContain('Allow: /');
    expect(lines).toContain('Allow: /wallet/add');
    expect(lines.indexOf('Allow: /wallet/add')).toBeLessThan(lines.indexOf('Disallow: /wallet/'));
  });

  it('advertises the sitemap on the canonical origin', () => {
    expect(lines).toContain('Sitemap: https://stackr.ie/sitemap.xml');
  });

  it('never blanket-disallows on production', () => {
    expect(lines).not.toContain('Disallow: /');
  });
});

describe('buildRobotsTxt (preview)', () => {
  const body = buildRobotsTxt('https://stackr-preview.workers.dev', false);
  const lines = body.split('\n');

  it('blanket-disallows and withdraws every content signal', () => {
    expect(lines).toContain('User-agent: *');
    expect(lines).toContain('Disallow: /');
    expect(lines).toContain('Content-Signal: search=no, ai-input=no, ai-train=no');
  });

  it('does not advertise a sitemap', () => {
    expect(body).not.toContain('Sitemap:');
  });
});

describe('isIndexableDeployment', () => {
  function request(url: string, headers: Record<string, string> = {}): Request {
    return new Request(url, { headers });
  }

  it('is true for a request that arrived on the production domain', () => {
    expect(isIndexableDeployment(request('https://stackr.ie/robots.txt'))).toBe(true);
  });

  it('reads the host, not the scheme — a proxied request keeps its identity', () => {
    expect(
      isIndexableDeployment(request('http://127.0.0.1/robots.txt', { host: 'stackr.ie' })),
    ).toBe(true);
    expect(
      isIndexableDeployment(
        request('http://127.0.0.1/robots.txt', { 'x-forwarded-host': 'stackr.ie' }),
      ),
    ).toBe(true);
  });

  it('is false for preview Workers and local dev', () => {
    expect(isIndexableDeployment(request('https://stackr-preview.workers.dev/robots.txt'))).toBe(
      false,
    );
    expect(isIndexableDeployment(request('http://localhost:3000/robots.txt'))).toBe(false);
    expect(
      isIndexableDeployment(
        request('http://127.0.0.1/robots.txt', { 'x-forwarded-host': 'preview.workers.dev' }),
      ),
    ).toBe(false);
  });
});
