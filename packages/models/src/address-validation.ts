import type { Chain } from './chain.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const patterns: Record<Chain, { regex: RegExp; description: string }> = {
  btc: {
    regex:
      /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1q[a-z0-9]{38,59}|bc1p[a-z0-9]{58})$/,
    description: 'BTC address must start with 1, 3, bc1q, or bc1p',
  },
  eth: {
    regex: /^0x[0-9a-fA-F]{40}$/,
    description: 'ETH address must start with 0x followed by 40 hex characters',
  },
  stx: {
    regex: /^(SP|ST)[0-9A-Z]{33,}$/,
    description: 'STX address must start with SP or ST',
  },
  sol: {
    regex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    description: 'SOL address must be 32-44 base58 characters',
  },
};

export function validateAddress(chain: Chain, address: string): ValidationResult {
  if (!address.trim()) {
    return { valid: false, error: 'Address is required' };
  }

  const { regex, description } = patterns[chain];

  if (!regex.test(address)) {
    return { valid: false, error: description };
  }

  return { valid: true };
}
