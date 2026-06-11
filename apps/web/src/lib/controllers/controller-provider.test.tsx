import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ControllerProvider, useController, useControllers } from './controller-provider';

// A tiny consumer that mirrors PreferencesController state and drives it — the
// same shape as the /labs page, minus the page chrome.
function PreferencesProbe() {
  const { preferences } = useControllers();
  const state = useController(preferences);
  return (
    <div>
      <span data-testid="currency">{state.displayCurrency}</span>
      <span data-testid="chains">{state.includedChains.join(',')}</span>
      <button onClick={() => preferences.setDisplayCurrency('eur')}>set-eur</button>
      <button onClick={() => preferences.setIncludedChains(['btc'])}>only-btc</button>
    </div>
  );
}

describe('useController', () => {
  it('mirrors controller state and re-renders on :stateChange', () => {
    render(
      <ControllerProvider>
        <PreferencesProbe />
      </ControllerProvider>,
    );

    expect(screen.getByTestId('currency').textContent).toBe('usd');

    fireEvent.click(screen.getByText('set-eur'));
    expect(screen.getByTestId('currency').textContent).toBe('eur');

    fireEvent.click(screen.getByText('only-btc'));
    expect(screen.getByTestId('chains').textContent).toBe('btc');
  });

  it('throws if used outside a ControllerProvider', () => {
    function Orphan() {
      useControllers();
      return null;
    }

    // Silence the expected React error boundary noise for this assertion.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow('must be used within a ControllerProvider');
    spy.mockRestore();
  });
});
