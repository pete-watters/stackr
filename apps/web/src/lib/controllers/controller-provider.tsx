'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  Messenger,
  PortfolioController,
  PreferencesController,
  type PortfolioControllerActions,
  type PortfolioControllerEvents,
  type PortfolioControllerMessenger,
  type PortfolioControllerState,
  type PreferencesControllerActions,
  type PreferencesControllerEvents,
  type PreferencesControllerMessenger,
  type PreferencesControllerState,
} from '@stackr/controllers';

/**
 * Bridges the controller/messenger world into React for the /labs demo. The
 * point it illustrates: the controller is the source of truth, and the UI is a
 * thin mirror that re-renders off `:stateChange` via `useSyncExternalStore`.
 *
 * This is intentionally scoped to the /labs route — it does NOT touch the app's
 * existing Zustand stores or React Query wiring.
 */

type RootMessenger = Messenger<
  PreferencesControllerActions | PortfolioControllerActions,
  PreferencesControllerEvents | PortfolioControllerEvents
>;

interface Controllers {
  messenger: RootMessenger;
  preferences: PreferencesController;
  portfolio: PortfolioController;
}

const ControllerContext = createContext<Controllers | null>(null);

export function ControllerProvider({ children }: { children: ReactNode }) {
  // One messenger, shared by both controllers; each is handed a narrowed view
  // via `getRestricted`. Built once and held in state so the instances survive
  // re-renders (the controllers, not React, own the state).
  const [controllers] = useState<Controllers>(() => {
    const messenger: RootMessenger = new Messenger();
    const preferences = new PreferencesController({
      messenger: messenger.getRestricted<PreferencesControllerMessenger>(),
    });
    const portfolio = new PortfolioController({
      messenger: messenger.getRestricted<PortfolioControllerMessenger>(),
    });
    return { messenger, preferences, portfolio };
  });

  return <ControllerContext.Provider value={controllers}>{children}</ControllerContext.Provider>;
}

export function useControllers(): Controllers {
  const controllers = useContext(ControllerContext);
  if (!controllers) {
    throw new Error('useControllers must be used within a ControllerProvider');
  }
  return controllers;
}

/**
 * Subscribe a component to a controller's state. Returns the current state and
 * re-renders on every `:stateChange`. `getSnapshot` returns `controller.state`,
 * whose reference is stable between updates (immer structural sharing), so
 * `useSyncExternalStore`'s `Object.is` check does the right thing with no extra
 * memoization.
 */
export function useController(controller: PreferencesController): PreferencesControllerState;
export function useController(controller: PortfolioController): PortfolioControllerState;
export function useController(
  controller: PreferencesController | PortfolioController,
): PreferencesControllerState | PortfolioControllerState {
  const { messenger } = useControllers();

  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      messenger.subscribe(
        `${controller.name}:stateChange` as PreferencesControllerEvents['type'],
        onStoreChange,
      ),
    [messenger, controller],
  );

  const getSnapshot = useCallback(() => controller.state, [controller]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
