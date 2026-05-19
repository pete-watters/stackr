'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { OrderBook } from '@stackr/models';
import { generateMockOrderBook, createKrakenOrderBookWs } from '@stackr/services';

interface UseOrderbookOptions {
  pair: string;
  mode?: 'mock' | 'live';
  mockInterval?: number;
  midPrice?: number;
}

export function useOrderbook({
  pair,
  mode = 'mock',
  mockInterval = 500,
  midPrice = 50000,
}: UseOrderbookOptions) {
  const [orderbook, setOrderbook] = useState<OrderBook | null>(null);
  const wsRef = useRef<{ close: () => void } | null>(null);

  const startMock = useCallback(() => {
    const update = () => {
      // Add slight price variation
      const variation = midPrice * (0.998 + Math.random() * 0.004);
      setOrderbook(generateMockOrderBook(variation, 25, pair));
    };
    update();
    const interval = setInterval(update, mockInterval);
    return () => clearInterval(interval);
  }, [pair, mockInterval, midPrice]);

  const startLive = useCallback(() => {
    const ws = createKrakenOrderBookWs(pair, setOrderbook);
    wsRef.current = ws;
    return () => ws.close();
  }, [pair]);

  useEffect(() => {
    const cleanup = mode === 'live' ? startLive() : startMock();
    return cleanup;
  }, [mode, startLive, startMock]);

  return { orderbook };
}
