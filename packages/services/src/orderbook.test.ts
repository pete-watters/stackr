import { describe, expect, it } from 'vitest';
import {
  applyBookFrame,
  bookStateToLadders,
  createBookState,
  serializeOrderBook,
  type KrakenWebSocketMessage,
} from './orderbook';

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

function snapshotFrame(
  bids: Array<[number, number]>,
  asks: Array<[number, number]>,
): KrakenWebSocketMessage {
  return {
    channel: 'book',
    type: 'snapshot',
    data: [
      {
        symbol: 'BTC/USD',
        bids: bids.map(([price, qty]) => ({ price, qty })),
        asks: asks.map(([price, qty]) => ({ price, qty })),
      },
    ],
  };
}

function updateFrame(
  bids: Array<[number, number]>,
  asks: Array<[number, number]>,
): KrakenWebSocketMessage {
  return { ...snapshotFrame(bids, asks), type: 'update' };
}

describe('applyBookFrame', () => {
  it('populates the book from a snapshot frame', () => {
    const state = createBookState();
    const changed = applyBookFrame(
      state,
      snapshotFrame(
        [
          [100, 1],
          [99, 2],
        ],
        [
          [101, 1.5],
          [102, 3],
        ],
      ),
      25,
    );

    expect(changed).toBe(true);
    expect(state.bids.size).toBe(2);
    expect(state.asks.size).toBe(2);
  });

  it('merges update frames into the existing book instead of replacing it', () => {
    const state = createBookState();
    applyBookFrame(
      state,
      snapshotFrame(
        [
          [100, 1],
          [99, 2],
          [98, 3],
        ],
        [
          [101, 1],
          [102, 2],
          [103, 3],
        ],
      ),
      25,
    );

    // The regression: a single-level update must not collapse the book to one row.
    const changed = applyBookFrame(state, updateFrame([[99, 5]], []), 25);

    expect(changed).toBe(true);
    expect(state.bids.size).toBe(3);
    expect(state.asks.size).toBe(3);
    expect(state.bids.get(99)).toBe(5);
  });

  it('removes a level when an update carries qty 0', () => {
    const state = createBookState();
    applyBookFrame(
      state,
      snapshotFrame(
        [
          [100, 1],
          [99, 2],
        ],
        [[101, 1]],
      ),
      25,
    );

    const changed = applyBookFrame(state, updateFrame([[99, 0]], []), 25);

    expect(changed).toBe(true);
    expect(state.bids.has(99)).toBe(false);
    expect(state.bids.size).toBe(1);
  });

  it('replaces the whole book on a new snapshot (reconnect case)', () => {
    const state = createBookState();
    applyBookFrame(state, snapshotFrame([[100, 1]], [[101, 1]]), 25);
    applyBookFrame(state, snapshotFrame([[200, 1]], [[201, 1]]), 25);

    expect([...state.bids.keys()]).toEqual([200]);
    expect([...state.asks.keys()]).toEqual([201]);
  });

  it('trims each side to the best `depth` levels', () => {
    const state = createBookState();
    applyBookFrame(
      state,
      snapshotFrame(
        [
          [100, 1],
          [99, 1],
          [98, 1],
          [97, 1],
        ],
        [
          [101, 1],
          [102, 1],
          [103, 1],
          [104, 1],
        ],
      ),
      2,
    );

    // Bids keep the highest prices, asks keep the lowest.
    expect([...state.bids.keys()].sort((a, b) => b - a)).toEqual([100, 99]);
    expect([...state.asks.keys()].sort((a, b) => a - b)).toEqual([101, 102]);
  });

  it('ignores non-book frames (status, heartbeat, subscribe acks)', () => {
    const state = createBookState();
    applyBookFrame(state, snapshotFrame([[100, 1]], [[101, 1]]), 25);

    expect(applyBookFrame(state, { channel: 'heartbeat' }, 25)).toBe(false);
    expect(applyBookFrame(state, { channel: 'status', data: [{}] }, 25)).toBe(false);
    expect(state.bids.size).toBe(1);
  });

  it('reports no change when an update only deletes an absent level', () => {
    const state = createBookState();
    applyBookFrame(state, snapshotFrame([[100, 1]], [[101, 1]]), 25);

    expect(applyBookFrame(state, updateFrame([[55, 0]], []), 25)).toBe(false);
  });
});

describe('bookStateToLadders', () => {
  it('produces ladders that serialize into a sorted, cumulative book', () => {
    const state = createBookState();
    applyBookFrame(
      state,
      snapshotFrame(
        [
          [99, 2],
          [100, 1],
        ],
        [
          [102, 3],
          [101, 1.5],
        ],
      ),
      25,
    );

    const { bids, asks } = bookStateToLadders(state);
    const book = serializeOrderBook(bids, asks, 'BTC/USD');

    expect(book.bids.map(b => b.price)).toEqual([100, 99]);
    expect(book.bids.map(b => b.cumulativeAmount)).toEqual([1, 3]);
    expect(book.asks.map(a => a.price)).toEqual([101, 102]);
    expect(book.asks.map(a => a.cumulativeAmount)).toEqual([1.5, 4.5]);
  });
});
