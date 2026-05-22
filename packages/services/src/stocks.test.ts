import { describe, it, expect } from 'vitest';
import { parseDailyCloses } from './stocks';

const SERIES = {
  '2026-05-21': {
    '1. open': '190.0',
    '2. high': '192.0',
    '3. low': '189.0',
    '4. close': '191.5',
    '5. volume': '100',
  },
  '2026-05-20': {
    '1. open': '188.0',
    '2. high': '189.5',
    '3. low': '187.0',
    '4. close': '189.0',
    '5. volume': '120',
  },
  '2026-05-19': {
    '1. open': '185.0',
    '2. high': '187.0',
    '3. low': '184.0',
    '4. close': '186.5',
    '5. volume': '90',
  },
};

describe('parseDailyCloses', () => {
  it('returns ascending close-price points', () => {
    expect(parseDailyCloses(SERIES, 30)).toEqual([
      { timestamp: new Date('2026-05-19').getTime(), price: 186.5 },
      { timestamp: new Date('2026-05-20').getTime(), price: 189.0 },
      { timestamp: new Date('2026-05-21').getTime(), price: 191.5 },
    ]);
  });

  it('keeps only the most recent `days` points', () => {
    expect(parseDailyCloses(SERIES, 2).map(point => point.price)).toEqual([189.0, 191.5]);
  });

  it('returns an empty array when the series is missing', () => {
    expect(parseDailyCloses(undefined, 30)).toEqual([]);
  });
});
