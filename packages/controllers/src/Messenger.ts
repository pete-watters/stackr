/**
 * Messenger — a minimal, self-contained mirror of `@metamask/messenger`.
 *
 * This is the communication backbone of the controller pattern. It carries two
 * orthogonal kinds of traffic:
 *
 *   - **Actions** — request/response. Exactly one handler is registered per
 *     action type; `call(type, ...args)` invokes it and returns its result.
 *     This is how one controller asks another for something synchronously
 *     (`messenger.call('PreferencesController:getState')`).
 *   - **Events** — publish/subscribe. Many handlers may subscribe to an event
 *     type; `publish(type, payload)` fans the payload out to all of them. This
 *     is how a controller announces "my state changed" without knowing who is
 *     listening (`messenger.publish('PreferencesController:stateChange', state)`).
 *
 * Type names below (`ActionConstraint`, `EventConstraint`,
 * `ExtractActionParameters`, `ExtractEventPayload`, …) deliberately match the
 * real package so that reading this file teaches the real vocabulary.
 *
 * Naming convention, also borrowed from MetaMask: every action/event type is
 * namespaced as `'ControllerName:thing'` — `'PortfolioController:refresh'`,
 * `'PreferencesController:stateChange'`. The namespace is what lets a single
 * shared messenger host many controllers without collisions.
 *
 * DIFFERENCES FROM THE REAL IMPLEMENTATION (see ADR 0013):
 *   - Real MetaMask events carry a *spread* payload (`payload: unknown[]`,
 *     `publish(type, ...payload)`); here each event carries a single payload
 *     value, which is all the `:stateChange` event needs.
 *   - Real MetaMask hands each controller a `RestrictedMessenger` (via
 *     `messenger.getRestricted({ name, allowedActions, allowedEvents })`) that
 *     enforces, at runtime, that a controller may only touch its own namespace
 *     plus an explicit allowlist. This minimal version models the *namespacing
 *     convention* and the *types* but does not enforce restriction at runtime.
 */

/** The shape every action must conform to: a namespaced type + a handler fn. */
export type ActionConstraint = {
  type: string;
  handler: (...args: never[]) => unknown;
};

/** The shape every event must conform to: a namespaced type + a payload. */
export type EventConstraint = {
  type: string;
  payload: unknown;
};

/** Given the action union and a concrete type, recover that action's handler. */
export type ExtractActionHandler<
  Action extends ActionConstraint,
  Type extends Action['type'],
> = Action extends { type: Type } ? Action['handler'] : never;

/** Given the action union and a concrete type, recover that action's params. */
export type ExtractActionParameters<
  Action extends ActionConstraint,
  Type extends Action['type'],
> = Action extends { type: Type } ? Parameters<Action['handler']> : never;

/** Given the action union and a concrete type, recover that action's result. */
export type ExtractActionResponse<
  Action extends ActionConstraint,
  Type extends Action['type'],
> = Action extends { type: Type } ? ReturnType<Action['handler']> : never;

/** Given the event union and a concrete type, recover that event's payload. */
export type ExtractEventPayload<
  Event extends EventConstraint,
  Type extends Event['type'],
> = Event extends { type: Type } ? Event['payload'] : never;

/** A subscriber's optional projection from the full payload onto a slice. */
type SelectorFunction<Payload, Selected> = (payload: Payload) => Selected;

/** Bookkeeping for one (handler, selector) pair on an event. */
type SubscriptionEntry = {
  handler: (...args: unknown[]) => void;
  selector?: SelectorFunction<unknown, unknown>;
  /** Last value the selector produced; used to suppress no-op notifications. */
  hasPrevious: boolean;
  previous: unknown;
};

export class Messenger<Action extends ActionConstraint, Event extends EventConstraint> {
  /** Exactly one handler per action type (request/response). */
  readonly #actions = new Map<string, (...args: unknown[]) => unknown>();

  /** Many subscribers per event type (publish/subscribe). */
  readonly #events = new Map<string, Set<SubscriptionEntry>>();

  /**
   * Return a view of this messenger narrowed to the action/event surface a
   * single controller is constructed against. This mirrors MetaMask's
   * `messenger.getRestricted({ name, allowedActions, allowedEvents })`, which is
   * how one shared messenger is handed to many controllers without each seeing
   * the whole system's surface.
   *
   * DIFFERENCE FROM THE REAL IMPLEMENTATION: MetaMask's `RestrictedMessenger`
   * also *enforces* the allowlist at runtime — a controller that tries to call
   * an action outside its allowed set throws. This minimal version performs the
   * narrowing at the type level only and returns the same underlying messenger
   * (see ADR 0013); nothing is blocked at runtime.
   */
  getRestricted<RestrictedMessenger>(): RestrictedMessenger {
    return this as unknown as RestrictedMessenger;
  }

  /**
   * Register the single handler for an action type. Throws if one already
   * exists — actions are request/response, so a second handler would be
   * ambiguous (this matches MetaMask, which also rejects duplicates).
   */
  registerActionHandler<Type extends Action['type']>(
    type: Type,
    handler: ExtractActionHandler<Action, Type>,
  ): void {
    if (this.#actions.has(type)) {
      throw new Error(`A handler for ${type} has already been registered`);
    }
    this.#actions.set(type, handler as unknown as (...args: unknown[]) => unknown);
  }

  /** Remove a previously registered action handler (used in teardown). */
  unregisterActionHandler(type: Action['type']): void {
    this.#actions.delete(type);
  }

  /**
   * Invoke an action's handler and return its result (request/response).
   * Throws if no handler is registered — a missing action is a programming
   * error, surfaced loudly rather than silently returning `undefined`.
   */
  call<Type extends Action['type']>(
    type: Type,
    ...args: ExtractActionParameters<Action, Type>
  ): ExtractActionResponse<Action, Type> {
    const handler = this.#actions.get(type);
    if (!handler) {
      throw new Error(`A handler for ${type} has not been registered`);
    }
    return handler(...args) as ExtractActionResponse<Action, Type>;
  }

  /**
   * Announce an event to every subscriber (publish/subscribe). Subscribers
   * with a selector are only notified when their projected slice changes;
   * subscribers without one are notified on every publish.
   */
  publish<Type extends Event['type']>(type: Type, payload: ExtractEventPayload<Event, Type>): void {
    const subscribers = this.#events.get(type);
    if (!subscribers) {
      return;
    }
    for (const entry of subscribers) {
      if (entry.selector) {
        const selected = entry.selector(payload);
        // Suppress notification when the watched slice is unchanged. With an
        // immer-produced payload, untouched branches keep their reference, so
        // `Object.is` is enough to tell "this slice didn't change" — no deep
        // comparison required. (Real MetaMask behaves the same way.)
        if (entry.hasPrevious && Object.is(selected, entry.previous)) {
          continue;
        }
        const previous = entry.hasPrevious ? entry.previous : undefined;
        entry.previous = selected;
        entry.hasPrevious = true;
        entry.handler(selected, previous);
      } else {
        entry.handler(payload);
      }
    }
  }

  /**
   * Subscribe to an event.
   *
   * Without a selector, `handler` receives the full payload on every publish.
   * With a selector, `handler` receives `(selectedValue, previousValue)` and
   * only fires when the selected slice changes — the mechanism that lets a
   * controller react to "the currency changed" without also re-running on every
   * unrelated preference write.
   *
   * Returns an unsubscribe function, which is exactly the contract React's
   * `useSyncExternalStore` wants from its `subscribe` argument.
   */
  subscribe<Type extends Event['type'], Selected = ExtractEventPayload<Event, Type>>(
    type: Type,
    handler: (selected: Selected, previous: Selected | undefined) => void,
    selector?: SelectorFunction<ExtractEventPayload<Event, Type>, Selected>,
  ): () => void {
    let subscribers = this.#events.get(type);
    if (!subscribers) {
      subscribers = new Set();
      this.#events.set(type, subscribers);
    }
    const entry: SubscriptionEntry = {
      handler: handler as (...args: unknown[]) => void,
      selector: selector as SelectorFunction<unknown, unknown> | undefined,
      hasPrevious: false,
      previous: undefined,
    };
    subscribers.add(entry);
    return () => {
      subscribers?.delete(entry);
    };
  }

  /** Remove a specific handler from an event type. */
  unsubscribe<Type extends Event['type']>(type: Type, handler: (...args: never[]) => void): void {
    const subscribers = this.#events.get(type);
    if (!subscribers) {
      return;
    }
    for (const entry of subscribers) {
      if (entry.handler === (handler as unknown)) {
        subscribers.delete(entry);
      }
    }
  }
}
