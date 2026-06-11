import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChainSchema } from '@stackr/models';

import type { AnalyticsEventMap } from './events.js';

const capture = vi.fn();
const init = vi.fn();

vi.mock('posthog-js', () => ({
  default: {
    init: (...args: unknown[]) => init(...args),
    capture: (...args: unknown[]) => capture(...args),
  },
}));

// Imported after the mock so the module under test picks up the mocked client.
const { track, initAnalytics, capturePageview } = await import('./analytics.js');

const ORIGINAL_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

beforeEach(() => {
  capture.mockClear();
  init.mockClear();
});

afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  else process.env.NEXT_PUBLIC_POSTHOG_KEY = ORIGINAL_KEY;
});

describe('analytics no-op without a key', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  });

  it('track() does not capture when no key is configured', () => {
    track('wallet_added', { chain: 'btc' });
    expect(capture).not.toHaveBeenCalled();
  });

  it('initAnalytics() does not init when no key is configured', () => {
    initAnalytics();
    expect(init).not.toHaveBeenCalled();
  });

  it('capturePageview() does not capture when no key is configured', () => {
    capturePageview('/wallet/btc');
    expect(capture).not.toHaveBeenCalled();
  });
});

describe('analytics with a key', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';
  });

  it('track() forwards the event name and props to posthog', () => {
    track('chain_viewed', { chain: 'eth' });
    expect(capture).toHaveBeenCalledWith('chain_viewed', { chain: 'eth' });
  });
});

// An address-like string for any supported chain. If a prop ever matches this,
// the no-PII contract has been broken.
const ADDRESS_LIKE =
  /(0x[a-fA-F0-9]{40})|(bc1[a-z0-9]{20,})|([13][a-km-zA-HJ-NP-Z1-9]{25,})|(S[PMT][0-9A-Z]{38,})|([1-9A-HJ-NP-Za-km-z]{32,44})/;

function stringValues(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value).flatMap(stringValues);
  return [];
}

describe('typed events carry no PII', () => {
  // Exhaustively exercise every event with every chain so a future prop
  // addition that leaks an address-shaped value fails this test.
  const events: {
    [E in keyof AnalyticsEventMap]: AnalyticsEventMap[E];
  }[keyof AnalyticsEventMap][] = ChainSchema.options.flatMap(chain => [
    { chain } satisfies AnalyticsEventMap['wallet_added'],
    { chain } satisfies AnalyticsEventMap['chain_viewed'],
  ]);

  it('no event prop contains an address-like string', () => {
    for (const props of events) {
      for (const value of stringValues(props)) {
        expect(value).not.toMatch(ADDRESS_LIKE);
      }
    }
  });

  it('event props only ever carry the coarse chain slug', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';
    track('wallet_added', { chain: 'sol' });
    const [, props] = capture.mock.calls[0] as [string, Record<string, unknown>];
    expect(Object.keys(props)).toEqual(['chain']);
    expect(ChainSchema.options).toContain(props.chain);
  });
});
