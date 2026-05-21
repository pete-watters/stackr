export interface ThemeConfig {
  value: string;
  label: string;
  bg: string;
  accent: string;
}

export const THEMES: readonly ThemeConfig[] = [
  { value: 'light', label: 'Light', bg: '#ffffff', accent: '#33334d' },
  { value: 'dark', label: 'Dark', bg: '#1e202e', accent: '#ffffff' },
  { value: 'midnight', label: 'Midnight', bg: '#0a0c18', accent: '#4d8fff' },
  { value: 'kraken', label: 'Kraken', bg: '#080d09', accent: '#00c853' },
  { value: 'solarized-dark', label: 'Solarized Dark', bg: '#002b36', accent: '#268bd2' },
  { value: 'high-contrast', label: 'High Contrast', bg: '#000000', accent: '#ffffff' },
] as const;

export type ThemeValue = (typeof THEMES)[number]['value'] | 'system';
