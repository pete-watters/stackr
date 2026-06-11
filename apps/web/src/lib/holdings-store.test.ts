import { describe as feature, it as scenario, expect, beforeEach } from 'vitest';
import { CryptoHoldingSchema } from '@stackr/models';
import { bdd } from './bdd';
const { given, when, then, and } = bdd;
import { useHoldingsStore } from './holdings-store';

beforeEach(() => {
  useHoldingsStore.setState({ holdings: [] });
  localStorage.clear();
});

feature('manual crypto holdings', () => {
  scenario('a crypto position round-trips through the store', () => {
    when('a Bitcoin position is added with a label', () =>
      useHoldingsStore.getState().addCryptoHolding({
        chain: 'btc',
        quantity: 0.5,
        label: 'Kraken balance',
      }),
    );
    then('it is stored as a valid crypto holding', () => {
      const [holding, ...rest] = useHoldingsStore.getState().holdings;
      expect(rest).toHaveLength(0);
      // Parsing confirms the persisted shape satisfies the schema downstream.
      const parsed = CryptoHoldingSchema.parse(holding);
      expect(parsed.type).toBe('crypto');
      expect(parsed.chain).toBe('btc');
      expect(parsed.quantity).toBe(0.5);
      expect(parsed.label).toBe('Kraken balance');
      expect(parsed.id).toBeDefined();
      expect(parsed.createdAt).toBeDefined();
    });
  });

  scenario('the label is optional', () => {
    when('a position is added without a label', () =>
      useHoldingsStore.getState().addCryptoHolding({ chain: 'eth', quantity: 2 }),
    );
    then('the holding has no label key', () => {
      const [holding] = useHoldingsStore.getState().holdings;
      expect(CryptoHoldingSchema.parse(holding).label).toBeUndefined();
    });
  });

  scenario('a crypto position can be removed by id', () => {
    given('a stored Solana position', () =>
      useHoldingsStore.getState().addCryptoHolding({ chain: 'sol', quantity: 10 }),
    );
    when('it is removed by id', () => {
      const { id } = useHoldingsStore.getState().holdings[0];
      useHoldingsStore.getState().removeHolding(id);
    });
    then('no holdings remain', () => {
      expect(useHoldingsStore.getState().holdings).toHaveLength(0);
    });
  });
});

feature('crypto quantity validation', () => {
  scenario('a zero quantity is rejected', () => {
    when('a position with zero quantity is added', () =>
      useHoldingsStore.getState().addCryptoHolding({ chain: 'btc', quantity: 0 }),
    );
    then('nothing is stored', () => {
      expect(useHoldingsStore.getState().holdings).toHaveLength(0);
    });
    and('the schema also rejects a zero quantity', () => {
      const result = CryptoHoldingSchema.safeParse({
        id: crypto.randomUUID(),
        type: 'crypto',
        chain: 'btc',
        quantity: 0,
        createdAt: new Date().toISOString(),
      });
      expect(result.success).toBe(false);
    });
  });

  scenario('a negative quantity is rejected', () => {
    when('a position with a negative quantity is added', () =>
      useHoldingsStore.getState().addCryptoHolding({ chain: 'eth', quantity: -1 }),
    );
    then('nothing is stored', () => {
      expect(useHoldingsStore.getState().holdings).toHaveLength(0);
    });
    and('the schema also rejects a negative quantity', () => {
      const result = CryptoHoldingSchema.safeParse({
        id: crypto.randomUUID(),
        type: 'crypto',
        chain: 'eth',
        quantity: -1,
        createdAt: new Date().toISOString(),
      });
      expect(result.success).toBe(false);
    });
  });
});

feature('persisted store migration', () => {
  scenario('a pre-crypto store rehydrates cleanly', async () => {
    const cash = {
      id: crypto.randomUUID(),
      type: 'cash',
      label: 'Savings',
      amount: 1000,
      currency: 'usd',
      interestRate: 4.5,
      createdAt: new Date().toISOString(),
    };
    given('a version 0 store holding a cash position plus a corrupt record', () =>
      localStorage.setItem(
        'stackr-holdings',
        JSON.stringify({ state: { holdings: [cash, { type: 'bogus' }] }, version: 0 }),
      ),
    );
    when('the store rehydrates under the current version', async () => {
      await useHoldingsStore.persist.rehydrate();
    });
    then('the valid cash holding survives', () => {
      const { holdings } = useHoldingsStore.getState();
      expect(holdings).toHaveLength(1);
      expect(holdings[0]).toMatchObject({ type: 'cash', label: 'Savings' });
    });
    and('a crypto position can still be added afterwards', () => {
      useHoldingsStore.getState().addCryptoHolding({ chain: 'stx', quantity: 100 });
      const types = useHoldingsStore.getState().holdings.map(h => h.type);
      expect(types).toEqual(['cash', 'crypto']);
    });
  });
});
