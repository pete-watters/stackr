import { describe, expect, it } from 'vitest';
import { ActivitySchema } from './activity.js';
import { TransactionSchema, type Transaction } from './transaction.js';

const TRANSACTION: Transaction = {
  hash: '0xabc',
  chain: 'eth',
  type: 'receive',
  amount: '1.5',
  counterparty: '0xdef',
  timestamp: '2026-06-11T10:00:00.000Z',
  confirmed: true,
};

describe('ActivitySchema', () => {
  it('extends a Transaction with the four feed fields', () => {
    const activity = ActivitySchema.parse({
      ...TRANSACTION,
      source: 'eth',
      wallet: '0xme',
      direction: 'incoming',
      category: 'transfer',
    });

    // Every Transaction field survives unchanged…
    expect(TransactionSchema.parse(activity)).toEqual(TRANSACTION);
    // …alongside the enrichment.
    expect(activity.source).toBe('eth');
    expect(activity.wallet).toBe('0xme');
    expect(activity.direction).toBe('incoming');
    expect(activity.category).toBe('transfer');
  });

  it('round-trips through parse without loss', () => {
    const input = {
      ...TRANSACTION,
      source: 'eth' as const,
      wallet: '0xme',
      direction: 'incoming' as const,
      category: 'transfer' as const,
    };

    expect(ActivitySchema.parse(ActivitySchema.parse(input))).toEqual(input);
  });

  it('rejects an unknown direction', () => {
    expect(() =>
      ActivitySchema.parse({
        ...TRANSACTION,
        source: 'eth',
        wallet: '0xme',
        direction: 'sideways',
        category: 'transfer',
      }),
    ).toThrow();
  });

  it('rejects a source that is not a known chain', () => {
    expect(() =>
      ActivitySchema.parse({
        ...TRANSACTION,
        source: 'doge',
        wallet: '0xme',
        direction: 'incoming',
        category: 'transfer',
      }),
    ).toThrow();
  });
});
