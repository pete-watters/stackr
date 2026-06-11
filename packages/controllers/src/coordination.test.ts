import { describe, expect, it, vi } from 'vitest';
import type { Balance, Chain, Currency, Price } from '@stackr/models';
import { Messenger } from './Messenger.js';
import {
  PreferencesController,
  type PreferencesControllerActions,
  type PreferencesControllerEvents,
  type PreferencesControllerMessenger,
} from './PreferencesController.js';
import {
  PortfolioController,
  type PortfolioControllerActions,
  type PortfolioControllerEvents,
  type PortfolioControllerMessenger,
  type WalletRef,
} from './PortfolioController.js';
import {
  WalletConnectionController,
  type WalletAccount,
  type WalletConnectionControllerActions,
  type WalletConnectionControllerEvents,
  type WalletConnectionControllerMessenger,
  type WalletSourceAdapter,
} from './WalletConnectionController.js';

/**
 * The point of the whole spike: two controllers coordinating through the
 * messenger, with neither holding a reference to the other. A preference change
 * in PreferencesController re-values the PortfolioController.
 */

type RootActions =
  | PreferencesControllerActions
  | PortfolioControllerActions
  | WalletConnectionControllerActions;
type RootEvents =
  | PreferencesControllerEvents
  | PortfolioControllerEvents
  | WalletConnectionControllerEvents;

const RATES: Record<Currency, number> = {
  usd: 1,
  eur: 0.9,
  gbp: 0.8,
  jpy: 150,
  cad: 1.3,
  aud: 1.5,
};
const USD_PRICE: Record<Chain, number> = { btc: 100, eth: 50, sol: 10, stx: 2 };

const WALLETS: WalletRef[] = [
  { chain: 'btc', address: 'a' },
  { chain: 'eth', address: 'b' },
];
const BALANCES: Record<string, string> = { a: '2', b: '4' };

function setup() {
  const messenger = new Messenger<RootActions, RootEvents>();
  const preferences = new PreferencesController({
    messenger: messenger.getRestricted<PreferencesControllerMessenger>(),
  });
  const fetchBalance = vi.fn(
    async (chain: Chain, address: string): Promise<Balance> => ({
      chain,
      address,
      rawBalance: BALANCES[address],
      balance: BALANCES[address],
      updatedAt: new Date().toISOString(),
    }),
  );
  const fetchPrices = vi.fn(
    async (chains: Chain[], currency: Currency): Promise<Price[]> =>
      chains.map(chain => ({
        chain,
        usdPrice: USD_PRICE[chain],
        fiatPrice: USD_PRICE[chain] * RATES[currency],
        currency,
        change24h: 0,
        updatedAt: new Date().toISOString(),
      })),
  );
  const portfolio = new PortfolioController({
    messenger: messenger.getRestricted<PortfolioControllerMessenger>(),
    fetchBalance,
    fetchPrices,
  });
  return { messenger, preferences, portfolio, fetchBalance, fetchPrices };
}

describe('PreferencesController → PortfolioController coordination', () => {
  it('re-fetches and re-values when the display currency changes', async () => {
    const { preferences, portfolio, fetchPrices } = setup();

    await portfolio.refresh(WALLETS);
    // usd: 2*100 + 4*50 = 400
    expect(portfolio.state.totalValue).toBe(400);

    // Change currency on the *preferences* controller — no portfolio reference.
    preferences.setDisplayCurrency('eur');
    await portfolio.refreshing;

    // eur (0.9): 400 * 0.9 = 360
    expect(portfolio.state.totalValue).toBeCloseTo(360);
    expect(portfolio.state.displayCurrency).toBe('eur');
    expect(fetchPrices).toHaveBeenLastCalledWith(expect.any(Array), 'eur');
  });

  it('re-filters purely (no refetch) when included chains change', async () => {
    const { preferences, portfolio, fetchBalance, fetchPrices } = setup();

    await portfolio.refresh(WALLETS);

    // Prime both preference selectors with one currency change first, so the
    // subsequent included-chains change fires only the included-chains handler.
    preferences.setDisplayCurrency('eur');
    await portfolio.refreshing;

    fetchBalance.mockClear();
    fetchPrices.mockClear();

    // Drop everything but BTC. This must be a pure recompute — no network.
    preferences.setIncludedChains(['btc']);

    // 2 BTC * 100 * 0.9 = 180 (eth excluded)
    expect(portfolio.state.totalValue).toBeCloseTo(180);
    expect(portfolio.state.includedChains).toEqual(['btc']);
    expect(fetchBalance).not.toHaveBeenCalled();
    expect(fetchPrices).not.toHaveBeenCalled();
  });

  it('routes a refresh triggered through the messenger action', async () => {
    const { messenger, portfolio } = setup();

    await messenger.call('PortfolioController:refresh', WALLETS);

    expect(portfolio.state.status).toBe('ready');
    expect(portfolio.state.totalValue).toBe(400);
  });
});

/**
 * A controllable in-memory wallet source, identical in spirit to the one in
 * `WalletConnectionController.test.ts` — no DOM, no vendor SDK.
 */
function createMockAdapter(id: string): WalletSourceAdapter & {
  emit: (accounts: WalletAccount[]) => void;
} {
  let accounts: WalletAccount[] = [];
  let listener: ((accounts: WalletAccount[]) => void) | null = null;
  return {
    id,
    chains: ['btc', 'eth'],
    connect: async () => undefined,
    disconnect: async () => undefined,
    getAccounts: () => accounts,
    onAccountsChanged: callback => {
      listener = callback;
      return () => {
        listener = null;
      };
    },
    emit: next => {
      accounts = next;
      listener?.(next);
    },
  };
}

describe('WalletConnectionController → PortfolioController coordination', () => {
  function setupConnected() {
    const messenger = new Messenger<RootActions, RootEvents>();
    new PreferencesController({
      messenger: messenger.getRestricted<PreferencesControllerMessenger>(),
    });
    const fetchBalance = vi.fn(
      async (chain: Chain, address: string): Promise<Balance> => ({
        chain,
        address,
        rawBalance: BALANCES[address] ?? '0',
        balance: BALANCES[address] ?? '0',
        updatedAt: new Date().toISOString(),
      }),
    );
    const fetchPrices = vi.fn(
      async (chains: Chain[], currency: Currency): Promise<Price[]> =>
        chains.map(chain => ({
          chain,
          usdPrice: USD_PRICE[chain],
          fiatPrice: USD_PRICE[chain] * RATES[currency],
          currency,
          change24h: 0,
          updatedAt: new Date().toISOString(),
        })),
    );
    const portfolio = new PortfolioController({
      messenger: messenger.getRestricted<PortfolioControllerMessenger>(),
      fetchBalance,
      fetchPrices,
    });
    const adapter = createMockAdapter('evm');
    const walletConnection = new WalletConnectionController({
      messenger: messenger.getRestricted<WalletConnectionControllerMessenger>(),
      adapters: [adapter],
    });
    return { portfolio, walletConnection, adapter, fetchBalance };
  }

  it('re-aggregates the portfolio when a wallet source reports new accounts', async () => {
    const { portfolio, adapter } = setupConnected();

    // A wallet connects itself — the portfolio reacts with no reference between
    // the two controllers, only the messenger.
    adapter.emit([
      { chain: 'btc', address: 'a' },
      { chain: 'eth', address: 'b' },
    ]);
    await portfolio.refreshing;

    expect(portfolio.state.status).toBe('ready');
    // usd: 2*100 + 4*50 = 400
    expect(portfolio.state.totalValue).toBe(400);
  });

  it('does not re-aggregate on a status-only change', async () => {
    const { portfolio, walletConnection, adapter, fetchBalance } = setupConnected();

    adapter.emit([{ chain: 'btc', address: 'a' }]);
    await portfolio.refreshing;
    fetchBalance.mockClear();

    // A connect() call flips status disconnected → connecting → connected, but
    // the account set is unchanged, so the portfolio must not refetch.
    await walletConnection.connect('evm');
    await portfolio.refreshing;

    expect(fetchBalance).not.toHaveBeenCalled();
  });

  it('clears the portfolio when the last source disconnects', async () => {
    const { portfolio, adapter } = setupConnected();

    adapter.emit([{ chain: 'btc', address: 'a' }]);
    await portfolio.refreshing;
    // 2 BTC * $100 = $200
    expect(portfolio.state.totalValue).toBe(200);

    adapter.emit([]);
    await portfolio.refreshing;
    expect(portfolio.state.holdings).toEqual([]);
    expect(portfolio.state.totalValue).toBe(0);
  });
});
