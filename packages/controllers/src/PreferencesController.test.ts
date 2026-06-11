import { describe, expect, it, vi } from 'vitest';
import { Messenger } from './Messenger.js';
import {
  PreferencesController,
  getDefaultPreferencesControllerState,
  type PreferencesControllerActions,
  type PreferencesControllerEvents,
} from './PreferencesController.js';

function setup() {
  const messenger = new Messenger<PreferencesControllerActions, PreferencesControllerEvents>();
  const controller = new PreferencesController({ messenger });
  return { messenger, controller };
}

describe('PreferencesController', () => {
  it('starts from the default state (usd, all chains)', () => {
    const { controller } = setup();

    expect(controller.state).toEqual(getDefaultPreferencesControllerState());
    expect(controller.state.displayCurrency).toBe('usd');
    expect(controller.state.includedChains).toEqual(['btc', 'stx', 'eth', 'sol']);
  });

  it('accepts a partial initial state override', () => {
    const messenger = new Messenger<PreferencesControllerActions, PreferencesControllerEvents>();
    const controller = new PreferencesController({ messenger, state: { displayCurrency: 'eur' } });

    expect(controller.state.displayCurrency).toBe('eur');
    expect(controller.state.includedChains).toEqual(['btc', 'stx', 'eth', 'sol']);
  });

  it('setDisplayCurrency updates state and publishes :stateChange', () => {
    const { messenger, controller } = setup();
    const handler = vi.fn();
    messenger.subscribe('PreferencesController:stateChange', handler);

    controller.setDisplayCurrency('gbp');

    expect(controller.state.displayCurrency).toBe('gbp');
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].displayCurrency).toBe('gbp');
  });

  it('setIncludedChains updates the filter', () => {
    const { controller } = setup();

    controller.setIncludedChains(['btc', 'eth']);

    expect(controller.state.includedChains).toEqual(['btc', 'eth']);
  });

  it('exposes the setters as messenger actions', () => {
    const { messenger, controller } = setup();

    messenger.call('PreferencesController:setDisplayCurrency', 'jpy');
    messenger.call('PreferencesController:setIncludedChains', ['sol']);

    expect(controller.state.displayCurrency).toBe('jpy');
    expect(controller.state.includedChains).toEqual(['sol']);
  });

  it('leaves the unchanged slice referentially stable across an update', () => {
    const { controller } = setup();
    const chainsBefore = controller.state.includedChains;

    controller.setDisplayCurrency('cad');

    // Only displayCurrency changed; immer keeps the includedChains array's
    // identity, which is what lets selector subscriptions skip no-op fires.
    expect(controller.state.includedChains).toBe(chainsBefore);
  });
});
