import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Outside the Workers runtime getCloudflareContext throws; the route then
// falls back to process.env — that's the path these tests exercise.
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(() => {
    throw new Error('not in workers runtime');
  }),
}));

const { POST } = await import('./route');

function rpcRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://stackr.ie/api/rpc/eth', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const ethCall = { jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: '0x0' }, 'latest'] };

describe('POST /api/rpc/eth', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ jsonrpc: '2.0', id: 1, result: '0x0' })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('forwards an allow-listed read method upstream', async () => {
    const res = await POST(rpcRequest(ethCall));

    expect(res.status).toBe(200);
    expect(res.headers.get('x-stackr-rpc-upstream')).toBe('public');
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('forwards the chain/block bookkeeping methods viem issues around reads', async () => {
    for (const method of ['eth_chainId', 'eth_blockNumber', 'eth_getBlockByNumber']) {
      const res = await POST(rpcRequest({ jsonrpc: '2.0', id: 1, method, params: [] }));
      expect(res.status).toBe(200);
    }
  });

  it('uses the Alchemy upstream when a server key is set, without echoing it', async () => {
    vi.stubEnv('ALCHEMY_API_KEY', 'secret-key-123');

    const res = await POST(rpcRequest(ethCall));
    const text = await res.text();

    expect(res.headers.get('x-stackr-rpc-upstream')).toBe('alchemy');
    expect(text).not.toContain('secret-key-123');
    const upstreamUrl = vi.mocked(fetch).mock.calls[0]?.[0];
    expect(String(upstreamUrl)).toContain('alchemy');
    expect(String(upstreamUrl)).toContain('secret-key-123');
  });

  it('falls back to the public RPC when no key is set', async () => {
    const res = await POST(rpcRequest(ethCall));

    expect(res.status).toBe(200);
    expect(res.headers.get('x-stackr-rpc-upstream')).toBe('public');
    const upstreamUrl = String(vi.mocked(fetch).mock.calls[0]?.[0]);
    expect(upstreamUrl).not.toContain('alchemy');
  });

  it('refuses methods outside the read-only allow-list', async () => {
    const res = await POST(
      rpcRequest({ jsonrpc: '2.0', id: 1, method: 'eth_sendRawTransaction', params: ['0xdead'] }),
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe(-32601);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses cross-origin requests', async () => {
    const res = await POST(rpcRequest(ethCall, { origin: 'https://evil.example' }));

    expect(res.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses cross-site requests flagged by Sec-Fetch-Site', async () => {
    const res = await POST(rpcRequest(ethCall, { 'sec-fetch-site': 'cross-site' }));

    expect(res.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('allows same-origin requests with an Origin header', async () => {
    const res = await POST(rpcRequest(ethCall, { origin: 'https://stackr.ie' }));

    expect(res.status).toBe(200);
  });

  it('rejects oversized bodies', async () => {
    const res = await POST(rpcRequest('x'.repeat(65 * 1024)));

    expect(res.status).toBe(413);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON and malformed JSON-RPC shapes', async () => {
    expect((await POST(rpcRequest('{not json'))).status).toBe(400);
    expect((await POST(rpcRequest({ no: 'method' }))).status).toBe(400);
    expect((await POST(rpcRequest([]))).status).toBe(400);
  });

  it('maps upstream transport failure to the fixed 502 contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('connect ECONNREFUSED upstream-with-key');
      }),
    );

    const res = await POST(rpcRequest(ethCall));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error.message).toBe('upstream unavailable');
  });

  it('does not forward upstream HTTP error bodies verbatim', async () => {
    vi.stubEnv('ALCHEMY_API_KEY', 'secret-key-123');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('error for url /v2/secret-key-123', { status: 500 })),
    );

    const res = await POST(rpcRequest(ethCall));
    const text = await res.text();

    expect(res.status).toBe(502);
    expect(text).not.toContain('secret-key-123');
  });
});
