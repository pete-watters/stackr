import { describe as feature, it as scenario, expect } from 'vitest';
import { bdd } from './bdd';
const { then, and } = bdd;
import {
  CHART_RANGES,
  appendLiveTicks,
  assetId,
  buildAssetOptions,
  cryptoPair,
  findAsset,
  formatAxisTime,
  isRangeAllowed,
  toDataPoints,
} from './chart-assets';

feature('chart asset options', () => {
  scenario('falls back to the four core chains when nothing is tracked', () => {
    const options = buildAssetOptions({ walletChains: [], connectedChains: [], stockSymbols: [] });
    then('the default chains are offered', () =>
      expect(options.map(assetId)).toEqual([
        'crypto:btc',
        'crypto:eth',
        'crypto:sol',
        'crypto:stx',
      ]),
    );
  });

  scenario('dedupes a chain that is both watched and connected', () => {
    const options = buildAssetOptions({
      walletChains: ['eth', 'btc'],
      connectedChains: ['eth'],
      stockSymbols: [],
    });
    then('eth is listed once, in first-seen order', () =>
      expect(options.map(assetId)).toEqual(['crypto:eth', 'crypto:btc']),
    );
  });

  scenario('lists distinct stock symbols after the crypto assets', () => {
    const options = buildAssetOptions({
      walletChains: ['btc'],
      connectedChains: [],
      stockSymbols: ['AAPL', 'AAPL', 'TSLA'],
    });
    then('stocks follow crypto and are deduped', () =>
      expect(options.map(assetId)).toEqual(['crypto:btc', 'stock:AAPL', 'stock:TSLA']),
    );
  });
});

feature('asset id round-trip', () => {
  scenario('findAsset resolves an id back to its asset', () => {
    const options = buildAssetOptions({
      walletChains: ['sol'],
      connectedChains: [],
      stockSymbols: ['NVDA'],
    });
    then('a stock id resolves to the stock asset', () =>
      expect(findAsset(options, 'stock:NVDA')).toEqual({
        kind: 'stock',
        symbol: 'NVDA',
        label: 'NVDA',
      }),
    );
    and('an unknown id resolves to undefined', () =>
      expect(findAsset(options, 'crypto:doge')).toBeUndefined(),
    );
  });
});

feature('range availability', () => {
  const stock = { kind: 'stock', symbol: 'AAPL', label: 'AAPL' } as const;
  const crypto = { kind: 'crypto', chain: 'btc', label: 'Bitcoin (BTC)' } as const;
  const day = CHART_RANGES[0]; // 24H
  const week = CHART_RANGES[1]; // 7D

  scenario('24H is blocked for stocks (daily-only) but fine for crypto', () => {
    then('stocks cannot use 24H', () => expect(isRangeAllowed(stock, day)).toBe(false));
    and('stocks can use 7D', () => expect(isRangeAllowed(stock, week)).toBe(true));
    and('crypto can use 24H', () => expect(isRangeAllowed(crypto, day)).toBe(true));
  });
});

feature('data + time formatting', () => {
  scenario('history maps to x/y chart points', () => {
    then('timestamp becomes x and price becomes y', () =>
      expect(toDataPoints([{ timestamp: 1000, price: 12.5 }])).toEqual([{ x: 1000, y: 12.5 }]),
    );
  });

  scenario('axis time granularity follows the selected range', () => {
    const ms = Date.UTC(2026, 4, 21, 14, 30);
    then('a 1-day range shows a time of day', () =>
      expect(formatAxisTime(ms, 1)).toMatch(/\d{1,2}:\d{2}/),
    );
    and('a 1-year range shows a 2-digit year', () => expect(formatAxisTime(ms, 365)).toMatch(/26/));
  });
});

feature('crypto pair mapping', () => {
  scenario('maps each chain to its Kraken USD pair', () => {
    then('btc maps to BTC/USD', () => expect(cryptoPair('btc').pair).toBe('BTC/USD'));
    and('stx maps to STX/USD', () => expect(cryptoPair('stx').pair).toBe('STX/USD'));
    and('a mid price is provided for the mock book', () =>
      expect(cryptoPair('eth').midPrice).toBeGreaterThan(0),
    );
  });
});

feature('live tick tail', () => {
  const history = [
    { x: 1_000, y: 10 },
    { x: 2_000, y: 11 },
  ];

  scenario('returns history unchanged when there are no ticks', () => {
    then('the original series is returned', () =>
      expect(appendLiveTicks(history, [])).toEqual(history),
    );
  });

  scenario('appends only ticks newer than the last polled point', () => {
    const ticks = [
      { timestamp: 1_500, price: 99 }, // older than last point — dropped
      { timestamp: 3_000, price: 12 },
      { timestamp: 4_000, price: 13 },
    ];
    then('the stale tick is dropped and newer ticks extend the line', () =>
      expect(appendLiveTicks(history, ticks)).toEqual([
        { x: 1_000, y: 10 },
        { x: 2_000, y: 11 },
        { x: 3_000, y: 12 },
        { x: 4_000, y: 13 },
      ]),
    );
  });

  scenario('returns history unchanged when every tick predates the last point', () => {
    const ticks = [{ timestamp: 1_500, price: 99 }];
    then('nothing is appended', () => expect(appendLiveTicks(history, ticks)).toEqual(history));
  });
});
