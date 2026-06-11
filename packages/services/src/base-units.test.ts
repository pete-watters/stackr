import { describe, expect, it } from 'vitest';
import { formatBaseUnits } from './base-units';

describe('formatBaseUnits', () => {
  it('converts wei exactly where float math corrupts the digits', () => {
    // 12,345.678901234567890123 ETH — far beyond 2^53 wei.
    const wei = '12345678901234567890123';

    // The regression: the old float path produces a different (corrupted) string.
    const floatPath = (Number(BigInt(wei)) / 10 ** 18).toFixed(18);
    const exact = formatBaseUnits(wei, 18);

    expect(exact).toBe('12345.678901234567890123');
    expect(floatPath).not.toBe(exact);
  });

  it('handles a realistic non-round ETH balance exactly', () => {
    expect(formatBaseUnits('1234567890123456789', 18)).toBe('1.234567890123456789');
  });

  it('pads small amounts to full precision', () => {
    expect(formatBaseUnits('1', 18)).toBe('0.000000000000000001');
    expect(formatBaseUnits('0', 8)).toBe('0.00000000');
  });

  it('accepts numeric satoshi/lamport inputs', () => {
    expect(formatBaseUnits(150000000, 8)).toBe('1.50000000');
    expect(formatBaseUnits(2_500_000_000, 9)).toBe('2.500000000');
  });

  it('accepts bigint inputs', () => {
    expect(formatBaseUnits(10n ** 18n, 18)).toBe('1.000000000000000000');
  });

  it('truncates to displayDecimals without rounding', () => {
    expect(formatBaseUnits('1999999999999999999', 18, 8)).toBe('1.99999999');
  });

  it('handles negative amounts', () => {
    expect(formatBaseUnits('-1500000', 6)).toBe('-1.500000');
  });

  it('handles zero decimals', () => {
    expect(formatBaseUnits('42', 0)).toBe('42');
  });

  it('rejects non-integer strings', () => {
    expect(() => formatBaseUnits('1.5', 6)).toThrow('expected an integer string');
    expect(() => formatBaseUnits('0x16345785d8a0000', 18)).toThrow('expected an integer string');
    expect(() => formatBaseUnits('', 6)).toThrow('expected an integer string');
  });
});
