import { describe as feature, it as scenario, expect } from 'vitest';
import { bdd } from './bdd';
const { given, when, then, and } = bdd;
import { THEMES } from './theme-config';

feature('theme switcher config', () => {
  scenario('all required themes are registered', () => {
    const values = THEMES.map(t => t.value);
    then('light, dark and every new theme are present', () => {
      expect(values).toContain('light');
      expect(values).toContain('dark');
      expect(values).toContain('midnight');
      expect(values).toContain('kraken');
      expect(values).toContain('solarized-dark');
      expect(values).toContain('high-contrast');
    });
  });

  scenario('every theme entry has a non-empty label', () => {
    then('no theme is missing a label', () => {
      for (const t of THEMES) {
        expect(t.label.length).toBeGreaterThan(0);
      }
    });
  });

  scenario('every theme entry has swatch colours', () => {
    then('bg and accent are non-empty strings', () => {
      for (const t of THEMES) {
        expect(t.bg.length).toBeGreaterThan(0);
        expect(t.accent.length).toBeGreaterThan(0);
      }
    });
  });

  scenario('theme values are unique', () => {
    given('the list of theme values', () => {});
    when('deduped with a Set', () => {});
    then('no duplicates exist', () => {
      const values = THEMES.map(t => t.value);
      expect(new Set(values).size).toBe(values.length);
    });
  });
});

feature('theme label readability', () => {
  scenario('Kraken theme is identifiable', () => {
    const kraken = THEMES.find(t => t.value === 'kraken');
    then('it exists and is labelled', () => {
      expect(kraken).toBeDefined();
      expect(kraken?.label).toBe('Kraken');
    });
    and('its accent colour is terminal-green', () => {
      expect(kraken?.accent).toBe('#00c853');
    });
  });

  scenario('Solarized Dark theme value uses a hyphen', () => {
    then('the value matches the CSS class name', () => {
      const sol = THEMES.find(t => t.value === 'solarized-dark');
      expect(sol).toBeDefined();
    });
  });
});
