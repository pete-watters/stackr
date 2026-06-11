import type { PortfolioControllerState } from './PortfolioController.js';

/**
 * Derived-state selectors — pure functions of PortfolioController state.
 *
 * A core tenet of the pattern: derived values are *computed by pure selectors*,
 * never exposed as getter methods on the controller. The controller stores only
 * the raw inputs (per-chain holdings, the included-chain filter, the display
 * currency); anything calculable from those — the total, the included subset,
 * the weighted 24h change — is a selector. That keeps the stored state minimal
 * and the math testable in isolation, with no controller or messenger in scope.
 *
 * The controller calls these inside `update` to recompute `totalValue` whenever
 * an input changes, and the UI can call them directly against the state it
 * reads. Same functions, both sides — one definition of "the total".
 */

/** The holdings that currently count toward the portfolio, after filtering. */
export function selectIncludedHoldings(state: PortfolioControllerState) {
  return state.holdings.filter(holding => state.includedChains.includes(holding.chain));
}

/**
 * Total portfolio value in the display currency: sum of `amount * unitPrice`
 * over the *included* holdings. Filtering lives here, not in stored state, so
 * toggling a chain on/off is a pure recompute — no refetch.
 */
export function selectTotalValue(state: PortfolioControllerState): number {
  return selectIncludedHoldings(state).reduce(
    (total, holding) => total + holding.amount * holding.unitPrice,
    0,
  );
}

/**
 * Value-weighted 24h change across the included holdings. Returns 0 when the
 * portfolio is empty (nothing to weight).
 */
export function selectWeightedChange24h(state: PortfolioControllerState): number {
  const total = selectTotalValue(state);
  if (total <= 0) {
    return 0;
  }
  return selectIncludedHoldings(state).reduce((weighted, holding) => {
    const value = holding.amount * holding.unitPrice;
    return weighted + (holding.change24h * value) / total;
  }, 0);
}
