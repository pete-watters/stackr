import type { Order, OrderBook } from '@stackr/models';
import { OrderBookSchema } from '@stackr/models';
import type { OrderBookAdapter } from './ports.js';
import { parseOrThrow } from './validate.js';

/**
 * Serialize raw orderbook data — sort and compute cumulative amounts.
 * Ported from crypto-view pattern.
 *
 * This is the egress boundary for orderbook data: whether the raw ladders came
 * from a REST snapshot or a live Kraken WS frame, the validated `OrderBook` is
 * the only shape the charts layer ever consumes.
 */
export function serializeOrderBook(
  rawBids: Array<[number, number]>,
  rawAsks: Array<[number, number]>,
  pair: string,
): OrderBook {
  // Bids: sort descending by price, cumulative from top
  const sortedBids = [...rawBids].sort((a, b) => b[0] - a[0]);
  let bidCumulative = 0;
  const bids: Order[] = sortedBids.map(([price, amount]) => {
    bidCumulative += amount;
    return { price, amount, cumulativeAmount: bidCumulative };
  });

  // Asks: sort ascending by price, cumulative from top
  const sortedAsks = [...rawAsks].sort((a, b) => a[0] - b[0]);
  let askCumulative = 0;
  const asks: Order[] = sortedAsks.map(([price, amount]) => {
    askCumulative += amount;
    return { price, amount, cumulativeAmount: askCumulative };
  });

  return parseOrThrow(
    OrderBookSchema,
    {
      bids,
      asks,
      pair,
      updatedAt: new Date().toISOString(),
    },
    'orderbook.serialize(egress)',
  );
}

/**
 * Generate mock orderbook data for testing.
 * Produces Kraken-like realistic order distribution.
 */
export function generateMockOrderBook(
  midPrice: number = 50000,
  levels: number = 25,
  pair: string = 'BTC/USD',
): OrderBook {
  const bids: Array<[number, number]> = [];
  const asks: Array<[number, number]> = [];

  for (let i = 0; i < levels; i++) {
    const spread = midPrice * 0.001 * (i + 1);
    const bidPrice = midPrice - spread;
    const askPrice = midPrice + spread;
    const bidAmount = 0.1 + Math.random() * 2;
    const askAmount = 0.1 + Math.random() * 2;
    bids.push([parseFloat(bidPrice.toFixed(2)), parseFloat(bidAmount.toFixed(4))]);
    asks.push([parseFloat(askPrice.toFixed(2)), parseFloat(askAmount.toFixed(4))]);
  }

  return serializeOrderBook(bids, asks, pair);
}

export interface KrakenBookLevel {
  price: number;
  qty: number;
}

export interface KrakenWebSocketMessage {
  channel: string;
  type?: 'snapshot' | 'update';
  data?: Array<{
    symbol?: string;
    bids?: KrakenBookLevel[];
    asks?: KrakenBookLevel[];
  }>;
}

/**
 * Running state of a live order book: price → quantity per side.
 * Kraken v2 sends one `snapshot` frame with the full ladder, then `update`
 * frames carrying only the changed levels (qty 0 = level removed) — so the
 * book must be accumulated across frames, never rebuilt from a single frame.
 */
export interface BookState {
  bids: Map<number, number>;
  asks: Map<number, number>;
}

export function createBookState(): BookState {
  return { bids: new Map(), asks: new Map() };
}

function trimSide(side: Map<number, number>, depth: number, bestFirst: 'desc' | 'asc'): void {
  if (side.size <= depth) {
    return;
  }
  const sorted = [...side.keys()].sort((a, b) => (bestFirst === 'desc' ? b - a : a - b));
  for (const price of sorted.slice(depth)) {
    side.delete(price);
  }
}

/**
 * Apply one Kraken v2 `book` frame to the running state.
 * Snapshot frames replace each side; update frames upsert changed levels and
 * drop levels whose qty is 0. Each side is trimmed to the best `depth` levels
 * (bids keep the highest prices, asks the lowest). Returns true when the
 * frame changed the book.
 */
export function applyBookFrame(
  state: BookState,
  msg: KrakenWebSocketMessage,
  depth: number,
): boolean {
  if (msg.channel !== 'book' || !msg.data?.[0]) {
    return false;
  }
  const frame = msg.data[0];
  if (msg.type === 'snapshot') {
    state.bids.clear();
    state.asks.clear();
  }
  let changed = msg.type === 'snapshot';
  const applySide = (side: Map<number, number>, levels: KrakenBookLevel[] | undefined) => {
    for (const { price, qty } of levels ?? []) {
      if (qty === 0) {
        changed = side.delete(price) || changed;
      } else {
        side.set(price, qty);
        changed = true;
      }
    }
  };
  applySide(state.bids, frame.bids);
  applySide(state.asks, frame.asks);
  trimSide(state.bids, depth, 'desc');
  trimSide(state.asks, depth, 'asc');
  return changed;
}

/** Convert accumulated book state to the raw ladder shape serializeOrderBook expects. */
export function bookStateToLadders(state: BookState): {
  bids: Array<[number, number]>;
  asks: Array<[number, number]>;
} {
  return {
    bids: [...state.bids.entries()],
    asks: [...state.asks.entries()],
  };
}

/**
 * Create a WebSocket connection to Kraken for live orderbook data.
 * Accumulates snapshot + update frames into a running book and emits the
 * serialized book after every change. Reconnects with backoff on unexpected
 * close (a fresh snapshot rebuilds the state); `close()` stops everything.
 */
export function createKrakenOrderBookWs(
  pair: string,
  onUpdate: (book: OrderBook) => void,
  depth: number = 25,
): { close: () => void } {
  const state = createBookState();
  let ws: WebSocket | null = null;
  let closedByUser = false;
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    ws = new WebSocket('wss://ws.kraken.com/v2');

    ws.onopen = () => {
      reconnectAttempts = 0;
      ws?.send(
        JSON.stringify({
          method: 'subscribe',
          params: {
            channel: 'book',
            symbol: [pair],
            depth,
          },
        }),
      );
    };

    ws.onmessage = event => {
      try {
        const msg: KrakenWebSocketMessage = JSON.parse(String(event.data));
        if (applyBookFrame(state, msg, depth)) {
          const { bids, asks } = bookStateToLadders(state);
          onUpdate(serializeOrderBook(bids, asks, pair));
        }
      } catch (error) {
        console.warn('orderbook: failed to process Kraken frame', error);
      }
    };

    ws.onclose = () => {
      if (closedByUser || reconnectAttempts >= 5) {
        return;
      }
      reconnectAttempts += 1;
      const delay = Math.min(1000 * 2 ** reconnectAttempts, 15_000);
      console.warn(`orderbook: Kraken WS closed, reconnecting in ${delay}ms`);
      reconnectTimer = setTimeout(connect, delay);
    };
  };

  connect();

  return {
    close: () => {
      closedByUser = true;
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
      }
      ws?.close();
    },
  };
}

/** Pure-transform implementation of the orderbook port. */
export const orderBookAdapter: OrderBookAdapter = {
  serialize: serializeOrderBook,
};
