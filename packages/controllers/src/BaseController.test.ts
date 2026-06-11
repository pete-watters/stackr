import { describe, expect, it, vi } from 'vitest';
import {
  BaseController,
  deriveStateForFlag,
  type ControllerGetStateAction,
  type ControllerStateChangeEvent,
  type StateMetadata,
} from './BaseController.js';
import { Messenger } from './Messenger.js';

type CounterState = { count: number; secret: string };

const metadata: StateMetadata<CounterState> = {
  count: { persist: true, usedInUi: true, includeInStateLogs: true },
  secret: { persist: true, usedInUi: false, includeInStateLogs: false },
};

type CounterActions = ControllerGetStateAction<'Counter', CounterState>;
type CounterEvents = ControllerStateChangeEvent<'Counter', CounterState>;
type CounterMessenger = Messenger<CounterActions, CounterEvents>;

class CounterController extends BaseController<'Counter', CounterState, CounterMessenger> {
  constructor(messenger: CounterMessenger, state?: Partial<CounterState>) {
    super({
      messenger,
      metadata,
      name: 'Counter',
      state: { count: 0, secret: 'shh', ...state },
    });
  }

  increment() {
    this.update(state => {
      state.count += 1;
    });
  }
}

function setup(state?: Partial<CounterState>) {
  const messenger = new Messenger<CounterActions, CounterEvents>();
  const controller = new CounterController(messenger, state);
  return { messenger, controller };
}

describe('BaseController', () => {
  it('auto-registers a :getState action that returns current state', () => {
    const { messenger, controller } = setup({ count: 5 });

    expect(messenger.call('Counter:getState')).toEqual(controller.state);
    expect(messenger.call('Counter:getState').count).toBe(5);
  });

  it('publishes :stateChange with the next state when update runs', () => {
    const { messenger, controller } = setup();
    const handler = vi.fn();
    messenger.subscribe('Counter:stateChange', handler);

    controller.increment();

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].count).toBe(1);
  });

  it('replaces state immutably — the previous snapshot is never mutated', () => {
    const { controller } = setup();
    const before = controller.state;

    controller.increment();

    expect(controller.state).not.toBe(before);
    expect(before.count).toBe(0);
    expect(controller.state.count).toBe(1);
  });

  it('exposes state as read-only at the type level and frozen at runtime', () => {
    const { controller } = setup();

    // immer freezes produced state; mutating it throws in strict mode.
    expect(() => {
      (controller.state as { count: number }).count = 99;
    }).toThrow();
  });
});

describe('deriveStateForFlag', () => {
  const state: CounterState = { count: 3, secret: 'shh' };

  it('keeps only properties whose flag is true (persist → both here)', () => {
    expect(deriveStateForFlag(state, metadata, 'persist')).toEqual({ count: 3, secret: 'shh' });
  });

  it('drops sensitive properties for state logs (secret is includeInStateLogs:false)', () => {
    expect(deriveStateForFlag(state, metadata, 'includeInStateLogs')).toEqual({ count: 3 });
  });

  it('drops non-UI properties for the usedInUi projection', () => {
    expect(deriveStateForFlag(state, metadata, 'usedInUi')).toEqual({ count: 3 });
  });
});
