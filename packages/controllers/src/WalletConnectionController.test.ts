import { describe, expect, it, vi } from 'vitest';
import type { Chain } from '@stackr/models';
import { Messenger } from './Messenger.js';
import {
  WalletConnectionController,
  getDefaultWalletConnectionControllerState,
  selectAccountsByChain,
  selectConnectedAccounts,
  type WalletAccount,
  type WalletConnectionControllerActions,
  type WalletConnectionControllerEvents,
  type WalletConnectionControllerMessenger,
  type WalletConnectionControllerState,
  type WalletSourceAdapter,
  type WalletSourceStatus,
} from './WalletConnectionController.js';

/**
 * A controllable in-memory adapter. It needs no DOM and no vendor SDK — the
 * whole point of the {@link WalletSourceAdapter} port is that the controller can
 * be exercised with a stub like this. `emit` simulates the wallet pushing a new
 * account set (an external connect/disconnect/account switch); `connect`/
 * `disconnect` simulate the imperative flow.
 */
function createMockAdapter(
  id: string,
  chains: Chain[],
  accountsOnConnect: WalletAccount[],
): WalletSourceAdapter & {
  emit: (accounts: WalletAccount[]) => void;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
} {
  let accounts: WalletAccount[] = [];
  let listener: ((accounts: WalletAccount[]) => void) | null = null;

  const connect = vi.fn(async () => {
    accounts = accountsOnConnect;
  });
  const disconnect = vi.fn(async () => {
    accounts = [];
  });

  return {
    id,
    chains,
    connect,
    disconnect,
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

function setup(adapters: WalletSourceAdapter[]) {
  const messenger = new Messenger<
    WalletConnectionControllerActions,
    WalletConnectionControllerEvents
  >();
  const controller = new WalletConnectionController({
    messenger: messenger.getRestricted<WalletConnectionControllerMessenger>(),
    adapters,
  });
  return { messenger, controller };
}

const EVM_ACCOUNT: WalletAccount = { chain: 'eth', address: '0xabc' };
const STX_ACCOUNT: WalletAccount = { chain: 'stx', address: 'SP123' };
const BTC_ACCOUNT: WalletAccount = { chain: 'btc', address: 'bc1qleather' };

describe('WalletConnectionController', () => {
  it('seeds one disconnected source per adapter', () => {
    const evm = createMockAdapter('evm', ['eth'], [EVM_ACCOUNT]);
    const stacks = createMockAdapter('stacks', ['stx', 'btc'], [STX_ACCOUNT, BTC_ACCOUNT]);
    const { controller } = setup([evm, stacks]);

    expect(controller.state.sources).toEqual({
      evm: { status: 'disconnected', accounts: [], chains: ['eth'] },
      stacks: { status: 'disconnected', accounts: [], chains: ['stx', 'btc'] },
    });
  });

  it('starts from the documented default state with no adapters', () => {
    const { controller } = setup([]);
    expect(controller.state).toEqual(getDefaultWalletConnectionControllerState());
  });

  it('transitions disconnected → connecting → connected across connect()', async () => {
    const evm = createMockAdapter('evm', ['eth'], [EVM_ACCOUNT]);
    const { messenger, controller } = setup([evm]);
    const statuses: WalletSourceStatus[] = [];
    messenger.subscribe('WalletConnectionController:stateChange', state =>
      statuses.push(state.sources.evm.status),
    );

    await controller.connect('evm');

    expect(statuses).toEqual(['connecting', 'connected']);
    expect(controller.state.sources.evm.accounts).toEqual([EVM_ACCOUNT]);
    expect(evm.connect).toHaveBeenCalledOnce();
  });

  it('clears accounts and returns to disconnected on disconnect()', async () => {
    const evm = createMockAdapter('evm', ['eth'], [EVM_ACCOUNT]);
    const { controller } = setup([evm]);

    await controller.connect('evm');
    await controller.disconnect('evm');

    expect(controller.state.sources.evm).toEqual({
      status: 'disconnected',
      accounts: [],
      chains: ['eth'],
    });
    expect(evm.disconnect).toHaveBeenCalledOnce();
  });

  it('marks the source errored and rejects when connect() throws', async () => {
    const evm = createMockAdapter('evm', ['eth'], [EVM_ACCOUNT]);
    evm.connect.mockRejectedValueOnce(new Error('user rejected'));
    const { controller } = setup([evm]);

    await expect(controller.connect('evm')).rejects.toThrow('user rejected');
    expect(controller.state.sources.evm.status).toBe('error');
    expect(controller.state.sources.evm.accounts).toEqual([]);
  });

  it('throws for an unknown source id', async () => {
    const { controller } = setup([]);
    await expect(controller.connect('nope')).rejects.toThrow('No wallet source registered');
  });

  it('folds an external account change in through onAccountsChanged', () => {
    const evm = createMockAdapter('evm', ['eth'], [EVM_ACCOUNT]);
    const { controller } = setup([evm]);

    // The wallet connects itself (wagmi reconnect / Solana autoConnect), with no
    // controller.connect() call — the adapter just pushes the new account set.
    evm.emit([EVM_ACCOUNT]);
    expect(controller.state.sources.evm.status).toBe('connected');
    expect(controller.state.sources.evm.accounts).toEqual([EVM_ACCOUNT]);

    // …and disconnects itself.
    evm.emit([]);
    expect(controller.state.sources.evm.status).toBe('disconnected');
  });

  it('captures already-live connections via syncFromAdapters()', () => {
    const stacks = createMockAdapter('stacks', ['stx', 'btc'], []);
    // A session that was restored before the controller existed.
    stacks.emit([STX_ACCOUNT, BTC_ACCOUNT]);
    const { controller } = setup([stacks]);

    // Construction alone does not read the adapter…
    expect(controller.state.sources.stacks.status).toBe('disconnected');

    controller.syncFromAdapters();
    expect(controller.state.sources.stacks.accounts).toEqual([STX_ACCOUNT, BTC_ACCOUNT]);
    expect(controller.state.sources.stacks.status).toBe('connected');
  });

  it('stops reacting to a source after destroy()', () => {
    const evm = createMockAdapter('evm', ['eth'], [EVM_ACCOUNT]);
    const { controller } = setup([evm]);

    controller.destroy();
    evm.emit([EVM_ACCOUNT]);

    expect(controller.state.sources.evm.status).toBe('disconnected');
  });

  it('drives connect/disconnect through the messenger actions', async () => {
    const evm = createMockAdapter('evm', ['eth'], [EVM_ACCOUNT]);
    const { messenger, controller } = setup([evm]);

    await messenger.call('WalletConnectionController:connect', 'evm');
    expect(controller.state.sources.evm.status).toBe('connected');

    await messenger.call('WalletConnectionController:disconnect', 'evm');
    expect(controller.state.sources.evm.status).toBe('disconnected');
  });
});

describe('wallet-connection selectors', () => {
  const state: WalletConnectionControllerState = {
    sources: {
      evm: { status: 'connected', accounts: [EVM_ACCOUNT], chains: ['eth'] },
      stacks: {
        status: 'connected',
        accounts: [STX_ACCOUNT, BTC_ACCOUNT],
        chains: ['stx', 'btc'],
      },
    },
  };

  it('selectConnectedAccounts flattens across sources', () => {
    expect(selectConnectedAccounts(state)).toEqual([EVM_ACCOUNT, STX_ACCOUNT, BTC_ACCOUNT]);
  });

  it('selectAccountsByChain filters to one chain', () => {
    expect(selectAccountsByChain(state, 'btc')).toEqual([BTC_ACCOUNT]);
    expect(selectAccountsByChain(state, 'sol')).toEqual([]);
  });
});
