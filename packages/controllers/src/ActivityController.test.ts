import { describe, expect, it, vi } from 'vitest';
import { ActivitySchema, type Chain, type Transaction } from '@stackr/models';
import { Messenger } from './Messenger.js';
import {
  ActivityController,
  dedupeAndSort,
  getDefaultActivityControllerState,
  selectActivityByChain,
  selectActivityByWallet,
  toActivity,
  type ActivityControllerActions,
  type ActivityControllerEvents,
  type ActivityControllerMessenger,
  type ActivityControllerState,
  type ActivityStatus,
} from './ActivityController.js';
import {
  WalletConnectionController,
  type WalletAccount,
  type WalletConnectionControllerActions,
  type WalletConnectionControllerEvents,
  type WalletConnectionControllerMessenger,
  type WalletSourceAdapter,
} from './WalletConnectionController.js';

/**
 * A `Transaction` factory. The controller's only data source is
 * `fetchTransactions(chain, address)`, so the tests stub that and never touch a
 * network or a DOM — the same in-memory discipline the other controller tests
 * use.
 */
function tx(overrides: Partial<Transaction> & { hash: string; chain: Chain }): Transaction {
  return {
    type: 'receive',
    amount: '1',
    counterparty: 'someone',
    timestamp: '2026-06-11T10:00:00.000Z',
    confirmed: true,
    ...overrides,
  };
}

/** Per-chain transaction tables keyed by address → the fetcher reads from these. */
function makeFetchTransactions(table: Record<string, Transaction[]>) {
  return vi.fn(async (chain: Chain, address: string): Promise<Transaction[]> => {
    return table[`${chain}:${address}`] ?? [];
  });
}

type ActivityRootActions = ActivityControllerActions | WalletConnectionControllerActions;
type ActivityRootEvents = ActivityControllerEvents | WalletConnectionControllerEvents;

function setup(options: {
  table?: Record<string, Transaction[]>;
  fetchTransactions?: ReturnType<typeof makeFetchTransactions>;
}) {
  const messenger = new Messenger<ActivityRootActions, ActivityRootEvents>();
  const fetchTransactions = options.fetchTransactions ?? makeFetchTransactions(options.table ?? {});
  const controller = new ActivityController({
    messenger: messenger.getRestricted<ActivityControllerMessenger>(),
    fetchTransactions,
  });
  return { messenger, controller, fetchTransactions };
}

describe('ActivityController.refresh', () => {
  it('starts idle with an empty feed', () => {
    const { controller } = setup({});
    expect(controller.state).toEqual(getDefaultActivityControllerState());
    expect(controller.state.status).toBe('idle');
  });

  it('fans out across chains, merging into one timestamp-descending feed', async () => {
    const { controller } = setup({
      table: {
        'btc:addr-btc': [tx({ hash: 'b1', chain: 'btc', timestamp: '2026-06-01T00:00:00.000Z' })],
        'eth:addr-eth': [
          tx({ hash: 'e1', chain: 'eth', timestamp: '2026-06-10T00:00:00.000Z' }),
          tx({ hash: 'e2', chain: 'eth', timestamp: '2026-06-05T00:00:00.000Z' }),
        ],
      },
    });

    controller.setWatchedWallets([
      { chain: 'btc', address: 'addr-btc' },
      { chain: 'eth', address: 'addr-eth' },
    ]);
    await controller.refreshing;

    expect(controller.state.status).toBe('ready');
    // Newest first, regardless of source.
    expect(controller.state.items.map(item => item.hash)).toEqual(['e1', 'e2', 'b1']);
  });

  it('dedupes on (chain, hash) when two watched wallets see the same tx', async () => {
    // A self-transfer: the same eth tx is returned for both watched addresses.
    const shared = tx({ hash: 'shared', chain: 'eth', timestamp: '2026-06-09T00:00:00.000Z' });
    const { controller } = setup({
      table: {
        'eth:a': [shared, tx({ hash: 'only-a', chain: 'eth' })],
        'eth:b': [shared],
      },
    });

    controller.setWatchedWallets([
      { chain: 'eth', address: 'a' },
      { chain: 'eth', address: 'b' },
    ]);
    await controller.refreshing;

    const shareds = controller.state.items.filter(item => item.hash === 'shared');
    expect(shareds).toHaveLength(1);
    // Attributed to the first wallet seen.
    expect(shareds[0]?.wallet).toBe('a');
  });

  it('records a high-water-mark cursor per source', async () => {
    const { controller } = setup({
      table: {
        'btc:x': [
          tx({ hash: 'b-old', chain: 'btc', timestamp: '2026-06-01T00:00:00.000Z' }),
          tx({ hash: 'b-new', chain: 'btc', timestamp: '2026-06-08T00:00:00.000Z' }),
        ],
      },
    });

    controller.setWatchedWallets([{ chain: 'btc', address: 'x' }]);
    await controller.refreshing;

    expect(controller.state.cursorBySource.btc).toBe('2026-06-08T00:00:00.000Z');
  });

  it('transitions idle → loading → ready across a refresh', async () => {
    const { messenger, controller } = setup({
      table: { 'btc:x': [tx({ hash: 'b1', chain: 'btc' })] },
    });
    const statuses: ActivityStatus[] = [];
    messenger.subscribe('ActivityController:stateChange', state => statuses.push(state.status));

    controller.setWatchedWallets([{ chain: 'btc', address: 'x' }]);
    await controller.refreshing;

    expect(statuses).toEqual(['loading', 'ready']);
  });

  it('keeps a partial feed when one source fails, rather than blanking it', async () => {
    const fetchTransactions = vi.fn(async (chain: Chain): Promise<Transaction[]> => {
      if (chain === 'eth') {
        throw new Error('Etherscan rate limit');
      }
      return [tx({ hash: 'b1', chain: 'btc' })];
    });
    const { controller } = setup({ fetchTransactions });

    controller.setWatchedWallets([
      { chain: 'btc', address: 'x' },
      { chain: 'eth', address: 'y' },
    ]);
    await controller.refreshing;

    expect(controller.state.status).toBe('ready');
    expect(controller.state.items.map(item => item.hash)).toEqual(['b1']);
  });

  it('marks status error and rejects only when every source fails', async () => {
    const fetchTransactions = vi.fn(async (): Promise<Transaction[]> => {
      throw new Error('everything is down');
    });
    const { controller } = setup({ fetchTransactions });

    controller.setWatchedWallets([{ chain: 'btc', address: 'x' }]);
    await expect(controller.refreshing).rejects.toThrow('everything is down');
    expect(controller.state.status).toBe('error');
  });

  it('does not re-fetch when the wallet set is unchanged', async () => {
    const { controller, fetchTransactions } = setup({
      table: { 'btc:x': [tx({ hash: 'b1', chain: 'btc' })] },
    });

    controller.setWatchedWallets([{ chain: 'btc', address: 'x' }]);
    await controller.refreshing;
    fetchTransactions.mockClear();

    // Same set, different array identity — must be a no-op.
    controller.setWatchedWallets([{ chain: 'btc', address: 'x' }]);
    await controller.refreshing;

    expect(fetchTransactions).not.toHaveBeenCalled();
  });

  describe('scoped refresh', () => {
    async function primed() {
      const { controller, fetchTransactions } = setup({
        table: {
          'btc:x': [tx({ hash: 'b1', chain: 'btc', timestamp: '2026-06-02T00:00:00.000Z' })],
          'eth:y': [tx({ hash: 'e1', chain: 'eth', timestamp: '2026-06-03T00:00:00.000Z' })],
        },
      });
      controller.setWatchedWallets([
        { chain: 'btc', address: 'x' },
        { chain: 'eth', address: 'y' },
      ]);
      await controller.refreshing;
      fetchTransactions.mockClear();
      return { controller, fetchTransactions };
    }

    it('re-fetches only the scoped chain and keeps the rest of the feed', async () => {
      const { controller, fetchTransactions } = await primed();

      await controller.refresh({ chain: 'eth' });

      // Only the eth wallet was queried…
      expect(fetchTransactions).toHaveBeenCalledOnce();
      expect(fetchTransactions).toHaveBeenCalledWith('eth', 'y');
      // …and the btc entry from the prior full refresh is retained.
      expect(controller.state.items.map(item => item.hash).sort()).toEqual(['b1', 'e1']);
    });
  });
});

describe('ActivityController ← WalletConnectionController coordination', () => {
  function createMockAdapter(id: string): WalletSourceAdapter & {
    emit: (accounts: WalletAccount[]) => void;
  } {
    let accounts: WalletAccount[] = [];
    let listener: ((accounts: WalletAccount[]) => void) | null = null;
    return {
      id,
      chains: ['eth'],
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

  it('rebuilds the feed when a wallet source reports new accounts', async () => {
    const messenger = new Messenger<ActivityRootActions, ActivityRootEvents>();
    const fetchTransactions = makeFetchTransactions({
      'eth:0xabc': [tx({ hash: 'e1', chain: 'eth' })],
    });
    const activity = new ActivityController({
      messenger: messenger.getRestricted<ActivityControllerMessenger>(),
      fetchTransactions,
    });
    const adapter = createMockAdapter('evm');
    new WalletConnectionController({
      messenger: messenger.getRestricted<WalletConnectionControllerMessenger>(),
      adapters: [adapter],
    });

    // A wallet connects itself — the feed reacts through the messenger, with no
    // reference between the two controllers.
    adapter.emit([{ chain: 'eth', address: '0xabc' }]);
    await activity.refreshing;

    expect(activity.state.items.map(item => item.hash)).toEqual(['e1']);
    expect(fetchTransactions).toHaveBeenCalledWith('eth', '0xabc');
  });

  it('merges connected accounts with watch-only wallets', async () => {
    const messenger = new Messenger<ActivityRootActions, ActivityRootEvents>();
    const fetchTransactions = makeFetchTransactions({
      'btc:watch': [tx({ hash: 'b1', chain: 'btc', timestamp: '2026-06-01T00:00:00.000Z' })],
      'eth:0xabc': [tx({ hash: 'e1', chain: 'eth', timestamp: '2026-06-02T00:00:00.000Z' })],
    });
    const activity = new ActivityController({
      messenger: messenger.getRestricted<ActivityControllerMessenger>(),
      fetchTransactions,
    });
    const adapter = createMockAdapter('evm');
    new WalletConnectionController({
      messenger: messenger.getRestricted<WalletConnectionControllerMessenger>(),
      adapters: [adapter],
    });

    activity.setWatchedWallets([{ chain: 'btc', address: 'watch' }]);
    await activity.refreshing;
    adapter.emit([{ chain: 'eth', address: '0xabc' }]);
    await activity.refreshing;

    expect(activity.state.items.map(item => item.hash)).toEqual(['e1', 'b1']);
  });
});

describe('activity enrichment and selectors', () => {
  it('toActivity maps direction and a transfer category', () => {
    const activity = toActivity(
      tx({ hash: 'e1', chain: 'eth', type: 'send', amount: '2', counterparty: '0xdef' }),
      '0xme',
    );
    expect(activity).toMatchObject({
      source: 'eth',
      wallet: '0xme',
      direction: 'outgoing',
      category: 'transfer',
    });
    // The enriched shape is a valid Activity.
    expect(() => ActivitySchema.parse(activity)).not.toThrow();
  });

  it('toActivity flags an indeterminate (Solana-style placeholder) row as unknown', () => {
    const activity = toActivity(
      tx({ hash: 's1', chain: 'sol', type: 'receive', amount: '0', counterparty: 'unknown' }),
      'sol-addr',
    );
    expect(activity.category).toBe('unknown');
  });

  it('selectActivityByWallet and selectActivityByChain slice the feed', () => {
    const state: ActivityControllerState = {
      ...getDefaultActivityControllerState(),
      items: [
        toActivity(tx({ hash: 'e1', chain: 'eth' }), 'a'),
        toActivity(tx({ hash: 'b1', chain: 'btc' }), 'b'),
        toActivity(tx({ hash: 'e2', chain: 'eth' }), 'b'),
      ],
    };

    expect(
      selectActivityByWallet(state, 'b')
        .map(i => i.hash)
        .sort(),
    ).toEqual(['b1', 'e2']);
    expect(
      selectActivityByChain(state, 'eth')
        .map(i => i.hash)
        .sort(),
    ).toEqual(['e1', 'e2']);
  });

  it('dedupeAndSort collapses duplicates and orders newest-first', () => {
    const a = toActivity(
      tx({ hash: 'x', chain: 'eth', timestamp: '2026-06-01T00:00:00.000Z' }),
      'a',
    );
    const dup = toActivity(
      tx({ hash: 'x', chain: 'eth', timestamp: '2026-06-01T00:00:00.000Z' }),
      'b',
    );
    const newer = toActivity(
      tx({ hash: 'y', chain: 'eth', timestamp: '2026-06-05T00:00:00.000Z' }),
      'a',
    );

    const result = dedupeAndSort([a, dup, newer]);
    expect(result.map(i => i.hash)).toEqual(['y', 'x']);
  });
});
