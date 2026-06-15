import { describe, expect, it, vi } from 'vitest';
import type { Balance, Chain, Currency, Price } from '@stackr/models';
import { Messenger } from './Messenger.js';
import {
  PreferencesController,
  type PreferencesControllerActions,
  type PreferencesControllerEvents,
  type PreferencesControllerMessenger,
  type PreferencesControllerState,
} from './PreferencesController.js';
import {
  PortfolioController,
  getDefaultPortfolioControllerState,
  type PortfolioControllerActions,
  type PortfolioControllerEvents,
  type PortfolioControllerMessenger,
  type PortfolioStatus,
  type WalletRef,
} from './PortfolioController.js';
import { selectTotalValue, selectWeightedChange24h } from './selectors.js';

type RootActions = PreferencesControllerActions | PortfolioControllerActions;
type RootEvents = PreferencesControllerEvents | PortfolioControllerEvents;

const RATES: Record<Currency, number> = {
  usd: 1,
  eur: 0.9,
  gbp: 0.8,
  jpy: 150,
  cad: 1.3,
  aud: 1.5,
};
const USD_PRICE: Record<Chain, number> = { btc: 100, eth: 50, sol: 10, stx: 2, sui: 3 };

function makeFetchPrices() {
  return vi.fn(
    async (chains: Chain[], currency: Currency): Promise<Price[]> =>
      chains.map(chain => ({
        chain,
        usdPrice: USD_PRICE[chain],
        fiatPrice: USD_PRICE[chain] * RATES[currency],
        currency,
        change24h: 10,
        updatedAt: new Date().toISOString(),
      })),
  );
}

function makeFetchBalance(balances: Record<string, string>) {
  return vi.fn(
    async (chain: Chain, address: string): Promise<Balance> => ({
      chain,
      address,
      rawBalance: balances[address] ?? '0',
      balance: balances[address] ?? '0',
      updatedAt: new Date().toISOString(),
    }),
  );
}

function setup(options: {
  balances: Record<string, string>;
  preferences?: Partial<PreferencesControllerState>;
}) {
  const messenger = new Messenger<RootActions, RootEvents>();
  const preferences = new PreferencesController({
    messenger: messenger.getRestricted<PreferencesControllerMessenger>(),
    state: options.preferences,
  });
  const fetchBalance = makeFetchBalance(options.balances);
  const fetchPrices = makeFetchPrices();
  const portfolio = new PortfolioController({
    messenger: messenger.getRestricted<PortfolioControllerMessenger>(),
    fetchBalance,
    fetchPrices,
  });
  return { messenger, preferences, portfolio, fetchBalance, fetchPrices };
}

describe('PortfolioController.refresh', () => {
  it('starts idle with an empty portfolio', () => {
    const { portfolio } = setup({ balances: {} });

    expect(portfolio.state).toEqual(getDefaultPortfolioControllerState());
    expect(portfolio.state.status).toBe('idle');
  });

  it('aggregates multiple addresses on the same chain into one holding', async () => {
    const { portfolio } = setup({ balances: { a: '2', b: '1' } });
    const wallets: WalletRef[] = [
      { chain: 'btc', address: 'a' },
      { chain: 'btc', address: 'b' },
    ];

    await portfolio.refresh(wallets);

    expect(portfolio.state.status).toBe('ready');
    expect(portfolio.state.holdings).toEqual([
      { chain: 'btc', amount: 3, unitPrice: 100, change24h: 10 },
    ]);
    // 3 BTC * $100 = $300
    expect(portfolio.state.totalValue).toBe(300);
    expect(portfolio.state.lastUpdated).not.toBeNull();
  });

  it('values a multi-chain portfolio in the preferred currency', async () => {
    const { portfolio } = setup({
      balances: { a: '2', b: '4' },
      preferences: { displayCurrency: 'eur' },
    });

    await portfolio.refresh([
      { chain: 'btc', address: 'a' },
      { chain: 'eth', address: 'b' },
    ]);

    // EUR rate 0.9: (2 * 100 + 4 * 50) * 0.9 = 400 * 0.9 = 360
    expect(portfolio.state.displayCurrency).toBe('eur');
    expect(portfolio.state.totalValue).toBeCloseTo(360);
  });

  it('transitions idle → loading → ready across a refresh', async () => {
    const { messenger, portfolio } = setup({ balances: { a: '1' } });
    const statuses: PortfolioStatus[] = [];
    messenger.subscribe('PortfolioController:stateChange', state => statuses.push(state.status));

    await portfolio.refresh([{ chain: 'btc', address: 'a' }]);

    expect(statuses).toEqual(['loading', 'ready']);
  });

  it('marks status error and rejects when a source throws', async () => {
    const messenger = new Messenger<RootActions, RootEvents>();
    new PreferencesController({
      messenger: messenger.getRestricted<PreferencesControllerMessenger>(),
    });
    const fetchBalance = vi.fn(async () => {
      throw new Error('upstream down');
    });
    const portfolio = new PortfolioController({
      messenger: messenger.getRestricted<PortfolioControllerMessenger>(),
      fetchBalance,
      fetchPrices: makeFetchPrices(),
    });

    await expect(portfolio.refresh([{ chain: 'btc', address: 'a' }])).rejects.toThrow(
      'upstream down',
    );
    expect(portfolio.state.status).toBe('error');
  });
});

describe('portfolio selectors', () => {
  it('selectTotalValue counts only included chains', () => {
    const state = {
      ...getDefaultPortfolioControllerState(),
      holdings: [
        { chain: 'btc' as Chain, amount: 2, unitPrice: 100, change24h: 10 },
        { chain: 'eth' as Chain, amount: 4, unitPrice: 50, change24h: -5 },
      ],
      includedChains: ['btc'] as Chain[],
    };

    expect(selectTotalValue(state)).toBe(200);
  });

  it('selectWeightedChange24h weights each holding by its value share', () => {
    const state = {
      ...getDefaultPortfolioControllerState(),
      holdings: [
        { chain: 'btc' as Chain, amount: 2, unitPrice: 100, change24h: 10 }, // value 200
        { chain: 'eth' as Chain, amount: 4, unitPrice: 50, change24h: -5 }, // value 200
      ],
      includedChains: ['btc', 'eth'] as Chain[],
    };

    // Equal values → simple average of +10 and -5 = +2.5
    expect(selectWeightedChange24h(state)).toBeCloseTo(2.5);
  });

  it('selectWeightedChange24h is 0 for an empty portfolio', () => {
    expect(selectWeightedChange24h(getDefaultPortfolioControllerState())).toBe(0);
  });
});
