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

export interface KrakenWebSocketMessage {
  channel: string;
  data?: Array<{
    bids?: Array<{ price: number; qty: number }>;
    asks?: Array<{ price: number; qty: number }>;
  }>;
}

/**
 * Create a WebSocket connection to Kraken for live orderbook data.
 */
export function createKrakenOrderBookWs(
  pair: string,
  onUpdate: (book: OrderBook) => void,
  depth: number = 25,
): { close: () => void } {
  const ws = new WebSocket('wss://ws.kraken.com/v2');

  ws.onopen = () => {
    ws.send(
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
      const msg: KrakenWebSocketMessage = JSON.parse(event.data as string);
      if (msg.channel === 'book' && msg.data?.[0]) {
        const data = msg.data[0];
        const rawBids: Array<[number, number]> = (data.bids ?? []).map(b => [b.price, b.qty]);
        const rawAsks: Array<[number, number]> = (data.asks ?? []).map(a => [a.price, a.qty]);
        if (rawBids.length > 0 || rawAsks.length > 0) {
          onUpdate(serializeOrderBook(rawBids, rawAsks, pair));
        }
      }
    } catch {
      // Ignore parse errors for heartbeats etc.
    }
  };

  return {
    close: () => ws.close(),
  };
}

/** Pure-transform implementation of the orderbook port. */
export const orderBookAdapter: OrderBookAdapter = {
  serialize: serializeOrderBook,
};
