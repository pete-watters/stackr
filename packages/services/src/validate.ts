import type { ZodType } from 'zod';

/**
 * The enforcement primitive for the anti-corruption layer.
 *
 * Every adapter funnels both its *ingress* (the raw vendor payload) and its
 * *egress* (the normalized domain object) through this helper. If a payload
 * does not match the expected shape, we throw immediately with a readable,
 * context-tagged message instead of letting a malformed or partial value leak
 * into the app, where it would surface as a confusing render-time crash far
 * from the actual cause.
 *
 * Why a thrown error (rather than returning a Result): the adapters run inside
 * TanStack Query `queryFn`s, which already model failure as a rejected promise
 * (`error` state, retries, error boundaries). Throwing keeps the adapters in
 * lockstep with that contract and avoids a second parallel error channel.
 *
 * @param schema  the Zod schema describing the expected shape
 * @param value   the value to validate (vendor JSON or a normalized object)
 * @param context short label naming the boundary, e.g. `"btc.fetchBalance"`
 */
export function parseOrThrow<T>(schema: ZodType<T>, value: unknown, context: string): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    const detail = result.error.issues
      .map(issue => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ');
    throw new Error(`${context}: response failed validation — ${detail}`);
  }

  return result.data;
}
