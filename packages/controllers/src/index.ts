/**
 * `@stackr/controllers` — a faithful-minimal version of MetaMask's
 * controller/messenger pattern, built to study the real thing. See
 * `docs/DECISIONS/0013-controller-messenger-pattern-spike.md`.
 */

export {
  Messenger,
  type ActionConstraint,
  type EventConstraint,
  type ExtractActionHandler,
  type ExtractActionParameters,
  type ExtractActionResponse,
  type ExtractEventPayload,
} from './Messenger.js';

export {
  BaseController,
  deriveStateForFlag,
  type StateMetadata,
  type StatePropertyMetadata,
  type ControllerGetStateAction,
  type ControllerStateChangeEvent,
} from './BaseController.js';

export {
  PreferencesController,
  getDefaultPreferencesControllerState,
  type PreferencesControllerState,
  type PreferencesControllerActions,
  type PreferencesControllerEvents,
  type PreferencesControllerMessenger,
  type PreferencesControllerGetStateAction,
  type PreferencesControllerSetDisplayCurrencyAction,
  type PreferencesControllerSetIncludedChainsAction,
  type PreferencesControllerStateChangeEvent,
} from './PreferencesController.js';

export {
  PortfolioController,
  getDefaultPortfolioControllerState,
  type PortfolioControllerState,
  type PortfolioHolding,
  type PortfolioStatus,
  type WalletRef,
  type FetchBalanceFn,
  type FetchPricesFn,
  type PortfolioControllerActions,
  type PortfolioControllerEvents,
  type PortfolioControllerMessenger,
  type PortfolioControllerGetStateAction,
  type PortfolioControllerRefreshAction,
  type PortfolioControllerStateChangeEvent,
} from './PortfolioController.js';

export {
  WalletConnectionController,
  getDefaultWalletConnectionControllerState,
  selectConnectedAccounts,
  selectAccountsByChain,
  type WalletAccount,
  type WalletSourceAdapter,
  type WalletSourceStatus,
  type WalletSourceState,
  type WalletConnectionControllerState,
  type WalletConnectionControllerActions,
  type WalletConnectionControllerEvents,
  type WalletConnectionControllerMessenger,
  type WalletConnectionControllerGetStateAction,
  type WalletConnectionControllerConnectAction,
  type WalletConnectionControllerDisconnectAction,
  type WalletConnectionControllerStateChangeEvent,
} from './WalletConnectionController.js';

export { selectIncludedHoldings, selectTotalValue, selectWeightedChange24h } from './selectors.js';
