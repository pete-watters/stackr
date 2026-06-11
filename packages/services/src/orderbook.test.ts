import { describe, expect, it } from 'vitest';
import { serializeOrderBook } from './orderbook';

describe('serializeOrderBook', () => {
  it('sorts bids descending, asks ascending, and accumulates depth from the top', () => {
    const book = serializeOrderBook(
      [
        [100, 1],
        [102, 2],
        [101, 3],
      ],
      [
        [105, 1],
        [103, 2],
        [104, 3],
      ],
      'BTC/USD',
    );

    expect(book.bids.map(b => b.price)).toEqual([102, 101, 100]);
    expect(book.bids.map(b => b.cumulativeAmount)).toEqual([2, 5, 6]);

    expect(book.asks.map(a => a.price)).toEqual([103, 104, 105]);
    expect(book.asks.map(a => a.cumulativeAmount)).toEqual([2, 5, 6]);

    expect(book.pair).toBe('BTC/USD');
    // Egress schema guarantees a valid ISO timestamp.
    expect(() => new Date(book.updatedAt).toISOString()).not.toThrow();
  });
});
