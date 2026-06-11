import { describe, expect, it, vi } from 'vitest';
import { Messenger } from './Messenger.js';

// A tiny action/event surface, just for exercising the messenger in isolation.
type CounterGetAction = { type: 'Counter:get'; handler: () => number };
type CounterAddAction = { type: 'Counter:add'; handler: (amount: number) => number };
type CounterActions = CounterGetAction | CounterAddAction;

type CounterState = { count: number; label: string };
type CounterEvent = { type: 'Counter:stateChange'; payload: CounterState };

function makeMessenger() {
  return new Messenger<CounterActions, CounterEvent>();
}

describe('Messenger actions (request/response)', () => {
  it('routes a call to the registered handler and returns its result', () => {
    const messenger = makeMessenger();
    messenger.registerActionHandler('Counter:add', amount => amount + 1);

    expect(messenger.call('Counter:add', 41)).toBe(42);
  });

  it('throws when calling an action with no registered handler', () => {
    const messenger = makeMessenger();

    expect(() => messenger.call('Counter:get')).toThrow(
      'A handler for Counter:get has not been registered',
    );
  });

  it('rejects a second handler for the same action (one handler per action)', () => {
    const messenger = makeMessenger();
    messenger.registerActionHandler('Counter:get', () => 1);

    expect(() => messenger.registerActionHandler('Counter:get', () => 2)).toThrow(
      'A handler for Counter:get has already been registered',
    );
  });

  it('stops routing once an action handler is unregistered', () => {
    const messenger = makeMessenger();
    messenger.registerActionHandler('Counter:get', () => 7);
    expect(messenger.call('Counter:get')).toBe(7);

    messenger.unregisterActionHandler('Counter:get');
    expect(() => messenger.call('Counter:get')).toThrow();
  });
});

describe('Messenger events (publish/subscribe)', () => {
  it('delivers the payload to a plain subscriber on every publish', () => {
    const messenger = makeMessenger();
    const handler = vi.fn();
    messenger.subscribe('Counter:stateChange', handler);

    messenger.publish('Counter:stateChange', { count: 1, label: 'a' });
    messenger.publish('Counter:stateChange', { count: 2, label: 'a' });

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenLastCalledWith({ count: 2, label: 'a' });
  });

  it('fans a single publish out to multiple subscribers', () => {
    const messenger = makeMessenger();
    const first = vi.fn();
    const second = vi.fn();
    messenger.subscribe('Counter:stateChange', first);
    messenger.subscribe('Counter:stateChange', second);

    messenger.publish('Counter:stateChange', { count: 1, label: 'a' });

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it('with a selector, fires only when the selected slice changes', () => {
    const messenger = makeMessenger();
    const handler = vi.fn();
    messenger.subscribe('Counter:stateChange', handler, state => state.label);

    messenger.publish('Counter:stateChange', { count: 1, label: 'a' }); // first → fires
    messenger.publish('Counter:stateChange', { count: 2, label: 'a' }); // label same → skip
    messenger.publish('Counter:stateChange', { count: 3, label: 'b' }); // label changed → fires

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(1, 'a', undefined);
    expect(handler).toHaveBeenNthCalledWith(2, 'b', 'a');
  });

  it('returns an unsubscribe function that stops further delivery', () => {
    const messenger = makeMessenger();
    const handler = vi.fn();
    const unsubscribe = messenger.subscribe('Counter:stateChange', handler);

    messenger.publish('Counter:stateChange', { count: 1, label: 'a' });
    unsubscribe();
    messenger.publish('Counter:stateChange', { count: 2, label: 'a' });

    expect(handler).toHaveBeenCalledOnce();
  });

  it('no-ops publishing an event with no subscribers', () => {
    const messenger = makeMessenger();

    expect(() => messenger.publish('Counter:stateChange', { count: 1, label: 'a' })).not.toThrow();
  });
});
