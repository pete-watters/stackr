import { describe, expect, it } from 'vitest';
import { riskPillStyle } from './risk-pill';

describe('riskPillStyle — threshold mapping', () => {
  it('is success below 0.5', () => {
    expect(riskPillStyle(0)).toEqual({ variant: 'success', label: 'Healthy' });
    expect(riskPillStyle(0.49)).toMatchObject({ variant: 'success' });
  });

  it('is warning in [0.5, 0.8)', () => {
    expect(riskPillStyle(0.5)).toEqual({ variant: 'warning', label: 'Caution' });
    expect(riskPillStyle(0.79)).toMatchObject({ variant: 'warning' });
  });

  it('is destructive in [0.8, 1) — "At risk"', () => {
    expect(riskPillStyle(0.8)).toEqual({ variant: 'error', label: 'At risk' });
    expect(riskPillStyle(0.99)).toMatchObject({ variant: 'error', label: 'At risk' });
  });

  it('is destructive "Liquidatable" at or above 1', () => {
    expect(riskPillStyle(1)).toEqual({ variant: 'error', label: 'Liquidatable' });
    expect(riskPillStyle(2.5)).toEqual({ variant: 'error', label: 'Liquidatable' });
  });
});
