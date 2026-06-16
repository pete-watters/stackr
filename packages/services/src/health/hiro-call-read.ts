import { z } from 'zod';
import { parseOrThrow } from '../validate.js';
import {
  deserializeClarityHex,
  serializeClarityArg,
  type ClarityArg,
  type ClarityValue,
} from './clarity.js';

/**
 * Shared Hiro read-only contract-call client for the Stacks health adapters
 * (Zest, Granite). Stacks has no API/SDK shortcut for liquidation health, so
 * these adapters read the protocol contracts directly via Hiro's
 * `POST /v2/contracts/call-read/{principal}/{contract}/{function}` endpoint —
 * the node evaluates the function in read-only mode and returns the result as a
 * hex-encoded Clarity value, which we decode with our local codec (see
 * `clarity.ts`). This is the bespoke, per-protocol path ADR 0016 calls the moat.
 */

const HIRO_API = 'https://api.hiro.so';

/**
 * Hiro's `call-read` envelope. `okay: true` carries the serialized return value
 * in `result`; `okay: false` carries a Clarity runtime error in `cause`. We
 * validate this on ingress before touching `result` so a malformed envelope
 * fails loud at the boundary.
 */
const CallReadResponseSchema = z.object({
  okay: z.boolean(),
  result: z.string().optional(),
  cause: z.string().optional(),
});

/**
 * Read the optional Hiro API key from the environment. A key lifts the rate
 * limit from 50 rpm to 500 rpm, but is never required — the reads work keyless.
 * The key is server-side only (not a `NEXT_PUBLIC_` var), so in the browser
 * `process.env.HIRO_API_KEY` is simply `undefined` and we send no header. Guard
 * the `process` reference so this is safe in any runtime.
 */
export function hiroApiKey(): string | undefined {
  if (typeof process === 'undefined') {
    return undefined;
  }
  return process.env.HIRO_API_KEY || undefined;
}

export interface CallReadOptions {
  /** Deployer principal of the contract, e.g. `SP2VCQJGH7…`. */
  contractAddress: string;
  /** Contract name, e.g. `pool-0-reserve-v2-0`. */
  contractName: string;
  /** Read-only function to evaluate. */
  functionName: string;
  /** Arguments, in declaration order. */
  functionArgs: ClarityArg[];
  /** `sender` the node evaluates the call as; any valid principal works. */
  sender: string;
}

/** Injected dependencies, so the adapters can be tested without a network. */
export interface CallReadDeps {
  fetchFn?: typeof fetch;
  apiKey?: string;
}

/**
 * Evaluate one read-only contract call and return the decoded Clarity result.
 * Throws on a transport error, a non-`okay` envelope (surfacing the Clarity
 * `cause`), or a missing `result`, so the hook's per-adapter query reflects the
 * failure without leaking a partial value.
 */
export async function callReadOnly(
  options: CallReadOptions,
  deps: CallReadDeps = {},
): Promise<ClarityValue> {
  const fetchFn = deps.fetchFn ?? fetch;
  const apiKey = deps.apiKey ?? hiroApiKey();

  const url = `${HIRO_API}/v2/contracts/call-read/${options.contractAddress}/${options.contractName}/${options.functionName}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const res = await fetchFn(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sender: options.sender,
      arguments: options.functionArgs.map(serializeClarityArg),
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Hiro call-read error (${options.contractName}.${options.functionName}): ${res.status} ${res.statusText}`,
    );
  }

  const envelope = parseOrThrow(
    CallReadResponseSchema,
    await res.json(),
    `${options.contractName}.${options.functionName}(ingress)`,
  );

  if (!envelope.okay || envelope.result === undefined) {
    throw new Error(
      `Hiro call-read rejected (${options.contractName}.${options.functionName}): ${envelope.cause ?? 'no result'}`,
    );
  }

  return deserializeClarityHex(envelope.result);
}
