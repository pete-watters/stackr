import { describe as feature, it as scenario, expect, beforeEach } from 'vitest';
import { bdd } from './bdd';
const { given, when, then, and } = bdd;
import {
  applyCustomTheme,
  clearCustomTheme,
  contrastRatio,
  hasSufficientContrast,
  THEME_SEEDS,
  type CustomTheme,
} from './custom-theme';

function makeRoot(): HTMLElement {
  return document.createElement('div');
}

feature('custom theme — applying tokens to the root', () => {
  let root: HTMLElement;
  const theme: CustomTheme = {
    base: 'kraken',
    tokens: { ...THEME_SEEDS.kraken, background: '#123456', primary: '#abcdef' },
  };

  beforeEach(() => {
    root = makeRoot();
  });

  scenario('applies the base class and inline token overrides', () => {
    when('the custom theme is applied', () => applyCustomTheme(root, theme));
    then('the base theme class is present for inherited tokens', () => {
      expect(root.classList.contains('theme-kraken')).toBe(true);
    });
    and('the edited tokens are set as inline custom properties', () => {
      expect(root.style.getPropertyValue('--color-background')).toBe('#123456');
      expect(root.style.getPropertyValue('--color-primary')).toBe('#abcdef');
      expect(root.style.getPropertyValue('--color-chart-1')).toBe(THEME_SEEDS.kraken.chart1);
    });
  });

  scenario('clearing removes the base class and every override', () => {
    given('an applied custom theme', () => applyCustomTheme(root, theme));
    when('the custom theme is cleared', () => clearCustomTheme(root, theme.base));
    then('the base theme class is gone', () => {
      expect(root.classList.contains('theme-kraken')).toBe(false);
    });
    and('no token override remains on the root', () => {
      expect(root.style.getPropertyValue('--color-background')).toBe('');
      expect(root.style.getPropertyValue('--color-primary')).toBe('');
      expect(root.style.getPropertyValue('--color-chart-1')).toBe('');
    });
  });
});

feature('custom theme — contrast', () => {
  scenario('black on white is the maximum ratio', () => {
    then('the ratio is 21:1', () => {
      expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    });
  });

  scenario('flags a low-contrast pair', () => {
    then('near-identical greys fail the AA body threshold', () => {
      expect(hasSufficientContrast('#777777', '#7a7a7a')).toBe(false);
    });
    then('white on black passes', () => {
      expect(hasSufficientContrast('#ffffff', '#000000')).toBe(true);
    });
  });

  scenario('an unparseable colour does not block', () => {
    then('a null ratio is treated as sufficient', () => {
      expect(contrastRatio('not-a-colour', '#000000')).toBeNull();
      expect(hasSufficientContrast('not-a-colour', '#000000')).toBe(true);
    });
  });
});
