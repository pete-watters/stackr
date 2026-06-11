import type { Chain } from '@stackr/models';
import {
  BaseController,
  type ControllerGetStateAction,
  type ControllerStateChangeEvent,
  type StateMetadata,
} from './BaseController.js';
import type { Messenger } from './Messenger.js';

/**
 * WalletConnectionController — one interface over many wallet sources.
 *
 * This is the third controller in the spike (see ADR 0015), and the first one
 * whose job is to *own a connection to the outside world* rather than to derive
 * a value. It is stackr's analog of MetaMask's `AccountsController`: the place
 * that knows which accounts exist, which are connected, and announces when that
 * set changes — except the topology is inverted. MetaMask sits between **one**
 * wallet and **many** dapps; stackr sits between **many** wallet sources (EVM
 * via wagmi, Solana via wallet-adapter, Stacks via stacks-connect) and **many**
 * chains. So where MetaMask has a single account list, this controller keys its
 * state by `sourceId`.
 *
 * The controller depends only on the {@link WalletSourceAdapter} *port*; the
 * vendor SDKs stay behind their adapters, exactly the anti-corruption boundary
 * the data providers draw in ADR 0012. That keeps this file free of wagmi,
 * `@solana/*`, and `@stacks/*` types, and lets the unit tests drive it with
 * trivial in-memory adapters.
 *
 * Watch-only stays first-class and signature-free: this controller never asks a
 * source to *prove* an address. A connected source simply reports the accounts
 * it already holds; a watch-only address added elsewhere is just another account
 * with no source connection behind it. No signing flow exists, and none should
 * (see ADR 0013's "explicitly out of scope" and ADR 0015).
 */

/** A single account surfaced by a wallet source: an address on one chain. */
export type WalletAccount = {
  address: string;
  chain: Chain;
};

/**
 * The vendor-agnostic port every wallet source implements. This is the contract
 * the controller programs against; each concrete adapter (EVM, Solana, Stacks)
 * wraps exactly one vendor SDK and never lets its types escape.
 *
 * The shape mirrors the connection surface a wallet exposes: open/close the
 * connection, read the current accounts, and subscribe to changes. It is the
 * same `connect()/disconnect()/getAccounts()/onAccountsChanged()` quartet
 * MetaMask's keyring/provider surfaces use, narrowed to what a watch-only
 * portfolio tracker needs.
 */
export interface WalletSourceAdapter {
  /** Stable id, used as the key in the controller's `sources` record. */
  readonly id: string;
  /** The chains this source can contribute accounts for (Stacks yields two). */
  readonly chains: Chain[];
  /** Open the source's connect flow. Resolves once the vendor settles. */
  connect(): Promise<void>;
  /** Tear the connection down. */
  disconnect(): Promise<void>;
  /** The accounts the source currently exposes (a synchronous read). */
  getAccounts(): WalletAccount[];
  /**
   * Subscribe to account changes — connect, disconnect, or account switch in
   * the underlying wallet. Returns an unsubscribe function, the same contract
   * the messenger's own `subscribe` returns.
   */
  onAccountsChanged(callback: (accounts: WalletAccount[]) => void): () => void;
}

/**
 * The lifecycle of a single source. `connecting` and `error` are owned by the
 * `connect` action; `connected`/`disconnected` are derived from whether the
 * source currently reports any accounts, so an external connect (wagmi
 * reconnect, Solana autoConnect, a wallet-driven account switch) flows in
 * through `onAccountsChanged` and lands in the right state with no action call.
 */
export type WalletSourceStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/** Per-source slice of state: its status, the accounts it reports, its chains. */
export type WalletSourceState = {
  status: WalletSourceStatus;
  accounts: WalletAccount[];
  /**
   * The chains this source covers, mirrored from the adapter. The issue sketch
   * wrote this singular (`chain`); it is `chains` here because Stacks connect
   * yields a STX *and* a BTC address from one session — the multi-chain-per-
   * source case that is the whole point of the inverted topology (ADR 0015).
   */
  chains: Chain[];
};

export type WalletConnectionControllerState = {
  /** Connection state keyed by source id (`'evm'`, `'solana'`, `'stacks'`). */
  sources: Record<string, WalletSourceState>;
};

/**
 * `persist: false` — connection state is re-derived from the wallet SDKs on
 * load (wagmi reconnects, Solana auto-connects, the Stacks session is read from
 * its own storage), exactly as `wallet-store` deliberately excludes
 * `connectedAddresses` from its persisted slice. There is nothing here worth
 * writing to durable storage.
 *
 * `includeInStateLogs: false` — an address links a person to their on-chain
 * holdings, so it gets the same redaction judgement as PortfolioController's
 * `holdings`/`totalValue`: never into a diagnostic dump.
 */
const metadata: StateMetadata<WalletConnectionControllerState> = {
  sources: { persist: false, usedInUi: true, includeInStateLogs: false },
};

export function getDefaultWalletConnectionControllerState(): WalletConnectionControllerState {
  return { sources: {} };
}

const controllerName = 'WalletConnectionController';

export type WalletConnectionControllerGetStateAction = ControllerGetStateAction<
  'WalletConnectionController',
  WalletConnectionControllerState
>;

export type WalletConnectionControllerConnectAction = {
  type: 'WalletConnectionController:connect';
  handler: (sourceId: string) => Promise<void>;
};

export type WalletConnectionControllerDisconnectAction = {
  type: 'WalletConnectionController:disconnect';
  handler: (sourceId: string) => Promise<void>;
};

export type WalletConnectionControllerActions =
  | WalletConnectionControllerGetStateAction
  | WalletConnectionControllerConnectAction
  | WalletConnectionControllerDisconnectAction;

export type WalletConnectionControllerStateChangeEvent = ControllerStateChangeEvent<
  'WalletConnectionController',
  WalletConnectionControllerState
>;

export type WalletConnectionControllerEvents = WalletConnectionControllerStateChangeEvent;

/**
 * Unlike PortfolioController, this controller is purely a *source* on the
 * messenger: it reaches for no other controller's surface, so there is no
 * `Allowed*` union here. It is the upstream that others (PortfolioController,
 * later ActivityController) subscribe to — the same position
 * `AccountsController` occupies in MetaMask's graph.
 */
export type WalletConnectionControllerMessenger = Messenger<
  WalletConnectionControllerActions,
  WalletConnectionControllerEvents
>;

/** Seed one `sources` entry per adapter, all disconnected with no accounts. */
function buildInitialSources(
  adapters: WalletSourceAdapter[],
  override: Record<string, WalletSourceState> | undefined,
): Record<string, WalletSourceState> {
  const sources: Record<string, WalletSourceState> = {};
  for (const adapter of adapters) {
    sources[adapter.id] = {
      status: 'disconnected',
      accounts: [],
      chains: [...adapter.chains],
    };
  }
  return { ...sources, ...(override ?? {}) };
}

export class WalletConnectionController extends BaseController<
  'WalletConnectionController',
  WalletConnectionControllerState,
  WalletConnectionControllerMessenger
> {
  readonly #adapters: Map<string, WalletSourceAdapter>;

  /** Unsubscribe handles for every `onAccountsChanged` subscription. */
  readonly #unsubscribes: Array<() => void> = [];

  constructor({
    messenger,
    adapters,
    state,
  }: {
    messenger: WalletConnectionControllerMessenger;
    adapters: WalletSourceAdapter[];
    state?: Partial<WalletConnectionControllerState>;
  }) {
    super({
      messenger,
      metadata,
      name: controllerName,
      state: {
        ...getDefaultWalletConnectionControllerState(),
        sources: buildInitialSources(adapters, state?.sources),
      },
    });

    this.#adapters = new Map(adapters.map(adapter => [adapter.id, adapter]));

    this.messagingSystem.registerActionHandler(
      'WalletConnectionController:connect',
      this.connect.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      'WalletConnectionController:disconnect',
      this.disconnect.bind(this),
    );

    // Mirror every external account change into state. This is what replaces the
    // old `*-address-sync` effect components: instead of a React effect watching
    // a hook and pushing into the store, the adapter pushes into the controller,
    // and the controller is the single source of truth the UI mirrors.
    for (const adapter of adapters) {
      const unsubscribe = adapter.onAccountsChanged(accounts => {
        this.#applyAccounts(adapter.id, accounts);
      });
      this.#unsubscribes.push(unsubscribe);
    }
  }

  /**
   * Read every adapter's current accounts and fold them into state. Called once
   * on the client after mount to capture connections that were already live
   * before this controller existed (a wagmi reconnect, a restored Stacks
   * session) — the equivalent of the old sync components' mount effect.
   */
  syncFromAdapters(): void {
    for (const adapter of this.#adapters.values()) {
      this.#applyAccounts(adapter.id, adapter.getAccounts());
    }
  }

  /**
   * Open a source's connect flow. Drives the `connecting → connected` (or
   * `connecting → error`) status transition the adapter's passive
   * `onAccountsChanged` cannot express on its own. Registered as the
   * `WalletConnectionController:connect` action.
   */
  async connect(sourceId: string): Promise<void> {
    const adapter = this.#requireAdapter(sourceId);
    this.#setStatus(sourceId, 'connecting');
    try {
      await adapter.connect();
      this.#applyAccounts(sourceId, adapter.getAccounts());
    } catch (error) {
      this.#setStatus(sourceId, 'error');
      throw error;
    }
  }

  /** Tear down a source's connection and clear its accounts. */
  async disconnect(sourceId: string): Promise<void> {
    const adapter = this.#requireAdapter(sourceId);
    await adapter.disconnect();
    this.update(state => {
      const source = state.sources[sourceId];
      if (!source) {
        return;
      }
      source.status = 'disconnected';
      source.accounts = [];
    });
  }

  /** Drop every adapter subscription. Mirrors MetaMask's `destroy()`. */
  destroy(): void {
    while (this.#unsubscribes.length > 0) {
      const unsubscribe = this.#unsubscribes.pop();
      unsubscribe?.();
    }
  }

  #requireAdapter(sourceId: string): WalletSourceAdapter {
    const adapter = this.#adapters.get(sourceId);
    if (!adapter) {
      throw new Error(`No wallet source registered for id "${sourceId}"`);
    }
    return adapter;
  }

  #setStatus(sourceId: string, status: WalletSourceStatus): void {
    this.update(state => {
      const source = state.sources[sourceId];
      if (!source) {
        return;
      }
      source.status = status;
    });
  }

  /**
   * Apply an account set to a source. Status is derived from emptiness: any
   * accounts means `connected`, none means `disconnected`. This single path
   * handles both action-driven connects and external (wallet-initiated) ones.
   */
  #applyAccounts(sourceId: string, accounts: WalletAccount[]): void {
    this.update(state => {
      const source = state.sources[sourceId];
      if (!source) {
        return;
      }
      source.accounts = accounts;
      source.status = accounts.length > 0 ? 'connected' : 'disconnected';
    });
  }
}

/**
 * Flatten every source's accounts into one list. The portfolio- and
 * activity-facing view of "who is connected", independent of which source each
 * account came from — pure, so it is trivially testable and reusable by the UI.
 */
export function selectConnectedAccounts(state: WalletConnectionControllerState): WalletAccount[] {
  return Object.values(state.sources).flatMap(source => source.accounts);
}

/** The connected accounts on a single chain. */
export function selectAccountsByChain(
  state: WalletConnectionControllerState,
  chain: Chain,
): WalletAccount[] {
  return selectConnectedAccounts(state).filter(account => account.chain === chain);
}
