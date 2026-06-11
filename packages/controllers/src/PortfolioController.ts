import type { Balance, Chain, Currency, Price } from '@stackr/models';
import {
  fetchBalance as defaultFetchBalance,
  fetchPrices as defaultFetchPrices,
} from '@stackr/services';
import {
  BaseController,
  type ControllerGetStateAction,
  type ControllerStateChangeEvent,
  type StateMetadata,
} from './BaseController.js';
import type { Messenger } from './Messenger.js';
import type {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from './PreferencesController.js';
import { selectTotalValue } from './selectors.js';

/**
 * PortfolioController — aggregates watched addresses into a single portfolio
 * value, and reacts to PreferencesController changes through the messenger.
 *
 * This is the second half of the "why does this pattern exist" story: one
 * controller alone never needs a messenger. The portfolio's value depends on a
 * preference (currency, included chains) that a *different* controller owns. The
 * messenger lets the portfolio react to that without either controller holding a
 * reference to the other — the textbook case the controller/messenger pattern
 * is built for.
 *
 * Two flavours of reaction, deliberately different (see ADR 0013):
 *   - **included-chains change → pure re-derive.** Filtering happens in a
 *     selector over already-fetched holdings, so toggling a chain recomputes the
 *     total synchronously, with no network.
 *   - **currency change → async re-fetch.** Prices are denominated per currency,
 *     so a new currency genuinely needs new data; the controller re-runs
 *     `refresh`, which reads the now-current preference and refetches.
 */

/** One chain's aggregated position, captured at refresh time. */
export type PortfolioHolding = {
  chain: Chain;
  /** Total crypto units summed across every watched address on this chain. */
  amount: number;
  /** Price per unit in the display currency at last refresh. */
  unitPrice: number;
  /** 24h percentage change for this chain. */
  change24h: number;
};

export type PortfolioStatus = 'idle' | 'loading' | 'ready' | 'error';

export type PortfolioControllerState = {
  /** Per-chain aggregated positions (the raw inputs the selectors derive from). */
  holdings: PortfolioHolding[];
  /** Derived total in the display currency, recomputed on every input change. */
  totalValue: number;
  /** Display currency the totals are denominated in (mirrored from preferences). */
  displayCurrency: Currency;
  /** Chains counted toward the total (mirrored from preferences). */
  includedChains: Chain[];
  /** ISO timestamp of the last successful refresh, or null if never refreshed. */
  lastUpdated: string | null;
  status: PortfolioStatus;
};

/**
 * `persist: false` throughout — the portfolio is recomputed from live market
 * data on load, so there is nothing worth persisting (contrast with
 * PreferencesController, whose user choices are `persist: true`).
 *
 * `holdings` and `totalValue` are flagged `includeInStateLogs: false`: a user's
 * balances and net worth are exactly the kind of data that must never leak into
 * a diagnostic dump — the same "safe to expose" judgement the app's balance
 * masking makes on screen, applied to logs.
 */
const metadata: StateMetadata<PortfolioControllerState> = {
  holdings: { persist: false, usedInUi: true, includeInStateLogs: false },
  totalValue: { persist: false, usedInUi: true, includeInStateLogs: false },
  displayCurrency: { persist: false, usedInUi: true, includeInStateLogs: true },
  includedChains: { persist: false, usedInUi: true, includeInStateLogs: true },
  lastUpdated: { persist: false, usedInUi: true, includeInStateLogs: true },
  status: { persist: false, usedInUi: true, includeInStateLogs: true },
};

export function getDefaultPortfolioControllerState(): PortfolioControllerState {
  return {
    holdings: [],
    totalValue: 0,
    displayCurrency: 'usd',
    includedChains: ['btc', 'stx', 'eth', 'sol'],
    lastUpdated: null,
    status: 'idle',
  };
}

const controllerName = 'PortfolioController';

/** The minimal address shape `refresh` needs — a chain and an address. */
export type WalletRef = {
  chain: Chain;
  address: string;
};

/** Injected data sources, so the controller is testable without the network. */
export type FetchBalanceFn = (chain: Chain, address: string) => Promise<Balance>;
export type FetchPricesFn = (chains: Chain[], currency: Currency) => Promise<Price[]>;

export type PortfolioControllerGetStateAction = ControllerGetStateAction<
  'PortfolioController',
  PortfolioControllerState
>;

export type PortfolioControllerRefreshAction = {
  type: 'PortfolioController:refresh';
  handler: (wallets: WalletRef[]) => Promise<void>;
};

export type PortfolioControllerActions =
  | PortfolioControllerGetStateAction
  | PortfolioControllerRefreshAction;

export type PortfolioControllerStateChangeEvent = ControllerStateChangeEvent<
  'PortfolioController',
  PortfolioControllerState
>;

export type PortfolioControllerEvents = PortfolioControllerStateChangeEvent;

/** Actions/events this controller is allowed to reach on the shared messenger. */
type AllowedActions = PreferencesControllerGetStateAction;
type AllowedEvents = PreferencesControllerStateChangeEvent;

/**
 * The messenger this controller is handed. It can speak its own actions/events
 * plus the explicit `Allowed*` surface of PreferencesController — the union
 * that, in real MetaMask, a `RestrictedMessenger` would enforce at runtime.
 */
export type PortfolioControllerMessenger = Messenger<
  PortfolioControllerActions | AllowedActions,
  PortfolioControllerEvents | AllowedEvents
>;

export class PortfolioController extends BaseController<
  'PortfolioController',
  PortfolioControllerState,
  PortfolioControllerMessenger
> {
  readonly #fetchBalance: FetchBalanceFn;
  readonly #fetchPrices: FetchPricesFn;

  /** The addresses of the last refresh, replayed when the currency changes. */
  #lastWallets: WalletRef[] = [];

  /** The most recent refresh promise, so callers/UI can await in-flight work. */
  #refreshing: Promise<void> = Promise.resolve();

  constructor({
    messenger,
    state,
    fetchBalance = defaultFetchBalance,
    fetchPrices = defaultFetchPrices,
  }: {
    messenger: PortfolioControllerMessenger;
    state?: Partial<PortfolioControllerState>;
    fetchBalance?: FetchBalanceFn;
    fetchPrices?: FetchPricesFn;
  }) {
    super({
      messenger,
      metadata,
      name: controllerName,
      state: { ...getDefaultPortfolioControllerState(), ...state },
    });

    this.#fetchBalance = fetchBalance;
    this.#fetchPrices = fetchPrices;

    this.messagingSystem.registerActionHandler(
      'PortfolioController:refresh',
      this.refresh.bind(this),
    );

    // React to preferences via the messenger. Two separate selector
    // subscriptions: each fires only when its own slice changes. Because
    // PreferencesController updates through immer, the unchanged slice keeps its
    // reference, so a currency write does not spuriously trigger the
    // included-chains handler, and vice versa.
    this.messagingSystem.subscribe(
      'PreferencesController:stateChange',
      this.#onDisplayCurrencyChange.bind(this),
      preferences => preferences.displayCurrency,
    );
    this.messagingSystem.subscribe(
      'PreferencesController:stateChange',
      this.#onIncludedChainsChange.bind(this),
      preferences => preferences.includedChains,
    );
  }

  /** The most recent (possibly in-flight) refresh, for awaiting/teardown. */
  get refreshing(): Promise<void> {
    return this.#refreshing;
  }

  /**
   * Aggregate the given addresses into the portfolio. Registered as the
   * `PortfolioController:refresh` action, so it can be triggered either by
   * holding the instance or by `messenger.call('PortfolioController:refresh')`.
   */
  async refresh(wallets: WalletRef[]): Promise<void> {
    this.#refreshing = this.#performRefresh(wallets);
    return this.#refreshing;
  }

  async #performRefresh(wallets: WalletRef[]): Promise<void> {
    this.#lastWallets = wallets;
    this.update(state => {
      state.status = 'loading';
    });

    // Read the current preferences off the messenger — no PreferencesController
    // reference, just its `:getState` action.
    const preferences = this.messagingSystem.call('PreferencesController:getState');

    try {
      const chains = [...new Set(wallets.map(wallet => wallet.chain))];
      const [balances, prices] = await Promise.all([
        Promise.all(wallets.map(wallet => this.#fetchBalance(wallet.chain, wallet.address))),
        chains.length > 0
          ? this.#fetchPrices(chains, preferences.displayCurrency)
          : ([] as Price[]),
      ]);

      const priceByChain = new Map(prices.map(price => [price.chain, price]));
      const amountByChain = new Map<Chain, number>();
      for (const balance of balances) {
        const current = amountByChain.get(balance.chain) ?? 0;
        amountByChain.set(balance.chain, current + Number.parseFloat(balance.balance));
      }

      const holdings: PortfolioHolding[] = [...amountByChain.entries()].map(([chain, amount]) => {
        const price = priceByChain.get(chain);
        return {
          chain,
          amount,
          unitPrice: price?.fiatPrice ?? 0,
          change24h: price?.change24h ?? 0,
        };
      });

      const totalValue = selectTotalValue({
        ...this.state,
        holdings,
        includedChains: preferences.includedChains,
      });

      this.update(state => {
        state.holdings = holdings;
        state.displayCurrency = preferences.displayCurrency;
        state.includedChains = preferences.includedChains;
        state.totalValue = totalValue;
        state.lastUpdated = new Date().toISOString();
        state.status = 'ready';
      });
    } catch (error) {
      this.update(state => {
        state.status = 'error';
      });
      throw error;
    }
  }

  /**
   * Currency changed → the stored prices are now in the wrong denomination, so
   * re-run the last refresh. `refresh` re-reads the (already updated) preference
   * itself, so we just replay the cached addresses.
   */
  #onDisplayCurrencyChange(): void {
    if (this.#lastWallets.length === 0) {
      return;
    }
    void this.refresh(this.#lastWallets);
  }

  /**
   * Included chains changed → pure re-derive. No prices to refetch; just update
   * the filter and recompute the total via the selector.
   */
  #onIncludedChainsChange(includedChains: Chain[]): void {
    const totalValue = selectTotalValue({ ...this.state, includedChains });
    this.update(state => {
      state.includedChains = includedChains;
      state.totalValue = totalValue;
    });
  }
}
