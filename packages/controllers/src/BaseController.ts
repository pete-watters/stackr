import { freeze, produce, type Draft } from 'immer';
import type { ActionConstraint, EventConstraint, Messenger } from './Messenger.js';

/**
 * BaseController — a minimal, self-contained mirror of
 * `@metamask/base-controller`'s `BaseController`.
 *
 * A controller owns a slice of state and is the *single source of truth* for
 * it. The rules the base class enforces are the whole point of the pattern:
 *
 *   1. State is private. Nothing outside the controller can mutate it.
 *   2. The only way to change state is `this.update(draft => { … })`, which
 *      runs the mutation through immer and then publishes a `:stateChange`
 *      event so subscribers (other controllers, the UI) learn about it.
 *   3. State is readable from anywhere on the messenger via the auto-registered
 *      `:getState` action, so a controller never needs a direct reference to
 *      another controller — only to the shared messenger.
 *
 * Subclasses pass their `name`, initial `state`, and a `metadata` record that
 * tags every state property with policy flags (see {@link StateMetadata}).
 */

/**
 * Per-property policy flags. These mirror `@metamask/base-controller`'s
 * `StatePropertyMetadata`:
 *
 *   - `persist` — should this property be written to durable storage?
 *   - `usedInUi` — does any UI read this property? (lets the platform ship a
 *     trimmed state to background contexts that have no UI).
 *   - `includeInStateLogs` — is this property safe to include in diagnostic
 *     state dumps / telemetry? This is the *same per-field "safe to expose"*
 *     idea as the app's own balance masking: a user's holdings and total are
 *     flagged `false` so they never leak into a log, exactly as `hideBalance`
 *     keeps them off the screen.
 *
 * Real MetaMask also allows each flag to be a *function* of the value (e.g.
 * persist only part of a property); this minimal version uses plain booleans.
 */
export type StatePropertyMetadata = {
  persist: boolean;
  usedInUi: boolean;
  includeInStateLogs: boolean;
};

/** A metadata record with one {@link StatePropertyMetadata} per state key. */
export type StateMetadata<State> = {
  [Property in keyof State]: StatePropertyMetadata;
};

/**
 * The `:getState` action every controller auto-registers. A consumer (or
 * another controller) calls `messenger.call('Name:getState')` to read state
 * without holding a controller reference.
 */
export type ControllerGetStateAction<Name extends string, State> = {
  type: `${Name}:getState`;
  handler: () => State;
};

/**
 * The `:stateChange` event every controller publishes after an update. The
 * payload is the full next state; subscribers may attach a selector to react
 * to just one slice.
 */
export type ControllerStateChangeEvent<Name extends string, State> = {
  type: `${Name}:stateChange`;
  payload: State;
};

/**
 * Project a state object down to only the properties whose given metadata flag
 * is `true`. This is how the flags earn their keep — it mirrors MetaMask's
 * `getPersistentState` / `getAnonymizedState` helpers. Persisting state, or
 * building a safe-to-log snapshot, becomes a single declarative pass driven by
 * the metadata rather than a hand-maintained allowlist.
 */
export function deriveStateForFlag<State extends Record<string, unknown>>(
  state: State,
  metadata: StateMetadata<State>,
  flag: keyof StatePropertyMetadata,
): Partial<State> {
  const result: Partial<State> = {};
  for (const key of Object.keys(state) as Array<keyof State>) {
    if (metadata[key][flag]) {
      result[key] = state[key];
    }
  }
  return result;
}

/**
 * The narrow messenger view BaseController needs for its *own* surface: it
 * registers `:getState` and publishes `:stateChange`. Subclasses are handed a
 * wider, precise messenger (`Msgr`); internally we look at it through this view
 * so the auto-wiring is fully typed without constraining `Msgr` structurally
 * (the generic-variance reason this is a cast is noted in ADR 0013).
 */
type OwnMessenger<Name extends string, State> = Messenger<
  ControllerGetStateAction<Name, State>,
  ControllerStateChangeEvent<Name, State>
>;

export class BaseController<
  Name extends string,
  State extends Record<string, unknown>,
  Msgr extends Messenger<ActionConstraint, EventConstraint>,
> {
  /** The controller's namespace — the prefix on all its actions and events. */
  readonly name: Name;

  /** Per-property policy flags. Public so platform code can read them. */
  readonly metadata: StateMetadata<State>;

  /**
   * The shared messenger. Named `messagingSystem` to match the real
   * `@metamask/base-controller` property (the sample controllers alias it as
   * `messenger`); subclasses talk to the rest of the system only through this.
   */
  protected readonly messagingSystem: Msgr;

  /** The single source of truth. Private — only `update` may replace it. */
  #internalState: State;

  constructor({
    messenger,
    metadata,
    name,
    state,
  }: {
    messenger: Msgr;
    metadata: StateMetadata<State>;
    name: Name;
    state: State;
  }) {
    this.messagingSystem = messenger;
    this.metadata = metadata;
    this.name = name;
    // Freeze the initial state so it is immutable from birth, exactly like the
    // states `update` produces — there is no "before first update" window where
    // a caller could mutate state out from under the controller.
    this.#internalState = freeze(state, true);

    // Auto-register the read action so anyone on the messenger can pull current
    // state by name, with no reference to this instance.
    this.#ownMessenger.registerActionHandler(`${name}:getState`, () => this.state);
  }

  /** This controller's own surface on the shared messenger (see {@link OwnMessenger}). */
  get #ownMessenger(): OwnMessenger<Name, State> {
    return this.messagingSystem as unknown as OwnMessenger<Name, State>;
  }

  /** Read-only view of current state. */
  get state(): State {
    return this.#internalState;
  }

  /**
   * The only path to a state change. The `callback` mutates an immer draft (or
   * returns a wholly new state); immer produces the next immutable state with
   * structural sharing — untouched branches keep their identity, which is what
   * makes selector-based subscriptions cheap and precise. The new state is then
   * published on `:stateChange`.
   */
  protected update(callback: (draft: Draft<State>) => void): void {
    const nextState = produce(this.#internalState, callback) as State;
    this.#internalState = nextState;
    this.#ownMessenger.publish(`${this.name}:stateChange`, nextState);
  }
}
