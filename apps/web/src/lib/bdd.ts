/**
 * A dependency-free BDD vocabulary for Vitest.
 *
 * `given` / `when` / `then` / `and` are labelled step wrappers: the label
 * documents intent in the source, the callback runs inline. No step runner,
 * no codegen, no extra dependency.
 *
 * The steps are exposed via a single `bdd` object rather than named exports.
 * That is deliberate: a module with a top-level export literally named `then`
 * becomes a "thenable", and Vitest's `await import()` of the test's module
 * graph then mis-resolves it (the suite collects zero tests). Destructuring
 * from a plain object sidesteps that entirely.
 *
 * `describe` / `it` are imported directly from `vitest` and aliased at the
 * import site (re-exporting them through a module also breaks collection):
 *
 *   import { describe as feature, it as scenario, expect, beforeEach } from 'vitest';
 *   import { bdd } from './bdd';
 *   const { given, when, then, and } = bdd;
 *
 *   feature('connected addresses', () => {
 *     scenario('an ETH address syncs into the store', () => {
 *       const address = '0xabc';
 *       given('an empty store', () => resetStore());
 *       when('the address connects', () => store.set('eth', [address]));
 *       then('it is stored under eth', () =>
 *         expect(store.get('eth')).toEqual([address]));
 *     });
 *   });
 *
 * Steps return their callback's value, so async steps compose with `await`.
 */
function step<T>(_label: string, fn: () => T): T {
  return fn();
}

export const bdd = {
  given: step,
  when: step,
  then: step,
  and: step,
};
