import { describe, expect, it } from 'vitest';
import { parseTickerFrame, type KrakenTickerMessage } from './ticker';

function tickerFrame(
  last: number | undefined,
  type: 'snapshot' | 'update' = 'update',
): KrakenTickerMessage {
  return {
    channel: 'ticker',
    type,
    data: [{ symbol: 'BTC/USD', last }],
  };
}

describe('parseTickerFrame', () => {
  it('extracts the last trade price from a ticker snapshot frame', () => {
    expect(parseTickerFrame(tickerFrame(65_000.5, 'snapshot'))).toBe(65_000.5);
  });

  it('extracts the last trade price from a ticker update frame', () => {
    expect(parseTickerFrame(tickerFrame(64_980.25))).toBe(64_980.25);
  });

  it('ignores non-ticker frames (heartbeat, subscribe acks, book)', () => {
    expect(parseTickerFrame({ channel: 'heartbeat' })).toBeNull();
    expect(parseTickerFrame({ channel: 'status', data: [{}] })).toBeNull();
    expect(parseTickerFrame({ channel: 'book', data: [{ last: 1 }] })).toBeNull();
  });

  it('returns null when the frame carries no usable last price', () => {
    expect(parseTickerFrame({ channel: 'ticker', data: [] })).toBeNull();
    expect(parseTickerFrame({ channel: 'ticker', data: [{ symbol: 'BTC/USD' }] })).toBeNull();
    expect(parseTickerFrame(tickerFrame(Number.NaN))).toBeNull();
    expect(parseTickerFrame(tickerFrame(Number.POSITIVE_INFINITY))).toBeNull();
  });

  it('passes through any finite price, including zero', () => {
    // The finite check only rejects NaN/Infinity; a genuine numeric price
    // (even 0) flows through unchanged.
    expect(parseTickerFrame(tickerFrame(0))).toBe(0);
  });
});
