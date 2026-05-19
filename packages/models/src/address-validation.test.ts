import { describe, it, expect } from 'vitest';
import { validateAddress } from './address-validation.js';

describe('validateAddress', () => {
  it('rejects empty address', () => {
    const result = validateAddress('btc', '');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Address is required');
  });

  it('rejects whitespace-only address', () => {
    const result = validateAddress('eth', '   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Address is required');
  });

  describe('BTC', () => {
    it('accepts P2PKH address (1...)', () => {
      expect(validateAddress('btc', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa').valid).toBe(true);
    });

    it('accepts P2SH address (3...)', () => {
      expect(validateAddress('btc', '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy').valid).toBe(true);
    });

    it('accepts bech32 address (bc1q...)', () => {
      expect(validateAddress('btc', 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4').valid).toBe(true);
    });

    it('accepts taproot address (bc1p...)', () => {
      expect(
        validateAddress('btc', 'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297')
          .valid,
      ).toBe(true);
    });

    it('rejects invalid BTC address', () => {
      const result = validateAddress('btc', '0x1234567890abcdef');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('BTC');
    });
  });

  describe('ETH', () => {
    it('accepts valid ETH address', () => {
      expect(validateAddress('eth', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045').valid).toBe(true);
    });

    it('accepts lowercase ETH address', () => {
      expect(validateAddress('eth', '0xd8da6bf26964af9d7eed9e03e53415d37aa96045').valid).toBe(true);
    });

    it('rejects ETH address without 0x prefix', () => {
      const result = validateAddress('eth', 'd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
      expect(result.valid).toBe(false);
    });

    it('rejects ETH address with wrong length', () => {
      const result = validateAddress('eth', '0xd8dA6BF269');
      expect(result.valid).toBe(false);
    });
  });

  describe('STX', () => {
    it('accepts SP address', () => {
      expect(validateAddress('stx', 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7').valid).toBe(true);
    });

    it('accepts ST address', () => {
      expect(validateAddress('stx', 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG').valid).toBe(true);
    });

    it('rejects invalid STX address', () => {
      const result = validateAddress('stx', 'bc1qtest');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('STX');
    });
  });

  describe('SOL', () => {
    it('accepts valid SOL address', () => {
      expect(validateAddress('sol', '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV').valid).toBe(
        true,
      );
    });

    it('rejects SOL address with invalid characters', () => {
      const result = validateAddress('sol', '0xInvalidSolanaAddress!!!!!!!!!!!!!!');
      expect(result.valid).toBe(false);
    });

    it('rejects too short SOL address', () => {
      const result = validateAddress('sol', 'short');
      expect(result.valid).toBe(false);
    });
  });
});
