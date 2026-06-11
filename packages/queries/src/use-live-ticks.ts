'use client';

import { useEffect, useState } from 'react';
import { createKrakenTickerWs, type Tick } from '@stackr/services';

/** Most recent ticks to retain — bounds memory and the live tail length. */
const DEFAULT_WINDOW = 60;

/**
 * Keep a sliding window of live ticks for `pair` off the Kraken ticker socket.
 *
 * The chart owns its history (polled from CoinGecko); this hook only supplies
 * the live tail to append. When `enabled` is false — Mock mode, or a stock
 * asset that Kraken doesn't quote — the socket is never opened and the window
 * is empty. If the socket fails the window simply stays empty and the chart
 * falls back to the polled series with no visible error.
 */
export function useLiveTicks(pair: string, enabled: boolean, windowSize = DEFAULT_WINDOW): Tick[] {
  const [ticks, setTicks] = useState<Tick[]>([]);

  useEffect(() => {
    // Switching pair (or toggling off) discards the previous pair's tail.
    setTicks([]);
    if (!enabled) {
      return;
    }
    const ws = createKrakenTickerWs(pair, tick => {
      setTicks(prev => [...prev, tick].slice(-windowSize));
    });
    return () => ws.close();
  }, [pair, enabled, windowSize]);

  return ticks;
}
