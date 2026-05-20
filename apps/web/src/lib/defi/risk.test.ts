import { describe as feature, it as scenario, expect } from 'vitest';
import { bdd } from '../bdd';
import { healthRiskLevel, riskMeta, formatHealthFactor } from './risk';

const { given, when, then } = bdd;

feature('liquidation health risk levels', () => {
  scenario('a health factor below 1.1 is danger (near liquidation)', () => {
    when('the health factor is 1.05', () => undefined);
    then('the risk level is danger', () => {
      expect(healthRiskLevel(1.05)).toBe('danger');
    });
  });

  scenario('a health factor at the liquidation point is danger', () => {
    then('HF of exactly 1.0 is danger', () => {
      expect(healthRiskLevel(1.0)).toBe('danger');
    });
  });

  scenario('a mid-range health factor is caution', () => {
    when('the health factor is 1.5', () => undefined);
    then('the risk level is caution', () => {
      expect(healthRiskLevel(1.5)).toBe('caution');
    });
  });

  scenario('a comfortable health factor is safe', () => {
    given('a health factor of 3', () => undefined);
    then('the risk level is safe', () => {
      expect(healthRiskLevel(3)).toBe('safe');
    });
  });

  scenario('each level has a label and a colour class', () => {
    then('danger surfaces a near-liquidation label', () => {
      expect(riskMeta('danger').label).toBe('Near liquidation');
      expect(riskMeta('danger').className).toContain('red');
    });
  });
});

feature('health factor formatting', () => {
  scenario('normal values show two decimals', () => {
    then('1.2345 renders as 1.23', () => {
      expect(formatHealthFactor(1.2345)).toBe('1.23');
    });
  });

  scenario('astronomically large values are capped', () => {
    then('a near-infinite HF renders as 1000+', () => {
      expect(formatHealthFactor(1e9)).toBe('1000+');
    });
  });
});
