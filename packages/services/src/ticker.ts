/**
 * Kraken v2 `ticker` channel client — the live price tail for the charts.
 *
 * Mirrors the order-book socket in `orderbook.ts`: a pure frame reducer kept
 * apart from the socket plumbing (so it unit-tests without a network), plus a
 * thin `createKrakenTickerWs` wrapper that subscribes and reconnects with
 * capped backoff. Where the book accumulates levels across frames, the ticker
 * only ever carries the latest values, so the reducer is a stateless extract
 * of the last trade price — there is nothing to accumulate.
 */

/** A single live price observation: the last trade price at a moment in time. */
export interface Tick {
  /** Epoch milliseconds the tick was observed. */
  timestamp: number;
  /** Last trade price for the pair. */
  price: number;
}

/**
 * Kraken v2 ticker frame. The `data` entries carry many fields (bid/ask,
 * volume, vwap, high/low, change…); we only consume `symbol` and `last` (the
 * last trade price), so the rest are left unmodeled.
 */
export interface KrakenTickerMessage {
  channel: string;
  type?: 'snapshot' | 'update';
  data?: Array<{
    symbol?: string;
    last?: number;
  }>;
}

/**
 * Extract the last trade price from one Kraken v2 ticker frame, or null when
 * the frame is not a usable ticker tick (heartbeat, subscribe ack, missing or
 * non-finite `last`). Pure: the caller stamps the timestamp so the reducer
 * stays deterministic and testable.
 */
export function parseTickerFrame(msg: KrakenTickerMessage): number | null {
  if (msg.channel !== 'ticker') {
    return null;
  }
  const last = msg.data?.[0]?.last;
  if (typeof last !== 'number' || !Number.isFinite(last)) {
    return null;
  }
  return last;
}

/**
 * Create a WebSocket connection to Kraken for live ticker data. Emits a `Tick`
 * for every ticker frame that carries a usable last price. Reconnects with
 * capped backoff on unexpected close; `close()` stops everything and prevents
 * further reconnects.
 */
export function createKrakenTickerWs(
  pair: string,
  onTick: (tick: Tick) => void,
): { close: () => void } {
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
            channel: 'ticker',
            symbol: [pair],
          },
        }),
      );
    };

    ws.onmessage = event => {
      try {
        const msg: KrakenTickerMessage = JSON.parse(String(event.data));
        const price = parseTickerFrame(msg);
        if (price !== null) {
          onTick({ timestamp: Date.now(), price });
        }
      } catch (error) {
        console.warn('ticker: failed to process Kraken frame', error);
      }
    };

    ws.onclose = () => {
      if (closedByUser || reconnectAttempts >= 5) {
        return;
      }
      reconnectAttempts += 1;
      const delay = Math.min(1000 * 2 ** reconnectAttempts, 15_000);
      console.warn(`ticker: Kraken WS closed, reconnecting in ${delay}ms`);
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
