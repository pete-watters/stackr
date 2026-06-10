import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseOrThrow } from './validate';

const Schema = z.object({ id: z.string(), n: z.number() });

describe('parseOrThrow', () => {
  it('returns the parsed value when the shape matches', () => {
    expect(parseOrThrow(Schema, { id: 'a', n: 1 }, 'ctx')).toEqual({ id: 'a', n: 1 });
  });

  it('throws with the context label and the offending path when validation fails', () => {
    expect(() => parseOrThrow(Schema, { id: 'a', n: 'nope' }, 'btc.fetchBalance(ingress)')).toThrow(
      /btc\.fetchBalance\(ingress\): response failed validation — n:/,
    );
  });

  it('labels the root when the whole value is the wrong type', () => {
    expect(() => parseOrThrow(Schema, 42, 'ctx')).toThrow(/<root>:/);
  });
});
