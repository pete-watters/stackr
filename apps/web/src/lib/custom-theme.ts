/**
 * Custom theme support — a user-defined palette layered on top of one of the
 * four shipped themes.
 *
 * The four built-in themes (terminal, kraken, leather, onyx) are complete token
 * sets defined as `.theme-*` blocks in `globals.css`. A custom theme reuses one
 * of those as its *base* (so radii, fonts, and the derived `*-foreground` tokens
 * are inherited unchanged) and overrides only the colour tokens the user is
 * allowed to edit. Overrides are applied as inline CSS custom properties on the
 * document root, which win over the class-based token values by specificity.
 */

export type BaseThemeId = 'terminal' | 'kraken' | 'leather' | 'onyx';

export const BASE_THEMES: ReadonlyArray<{ id: BaseThemeId; label: string }> = [
  { id: 'terminal', label: 'Terminal' },
  { id: 'kraken', label: 'Kraken Pro' },
  { id: 'leather', label: 'Leather Warm' },
  { id: 'onyx', label: 'Onyx Ledger' },
];

/**
 * The editable token set, mirroring what the `.theme-*` blocks define. Each
 * entry maps a stable storage key to its CSS custom property and a human label.
 * Radius and font tokens are deliberately omitted — they stay inherited from the
 * chosen base theme.
 */
export const CUSTOM_THEME_TOKENS = [
  { key: 'background', cssVar: '--color-background', label: 'Background' },
  { key: 'foreground', cssVar: '--color-foreground', label: 'Foreground' },
  { key: 'card', cssVar: '--color-card', label: 'Card' },
  { key: 'primary', cssVar: '--color-primary', label: 'Primary' },
  { key: 'success', cssVar: '--color-success', label: 'Success' },
  { key: 'warning', cssVar: '--color-warning', label: 'Warning' },
  { key: 'destructive', cssVar: '--color-destructive', label: 'Destructive' },
  { key: 'border', cssVar: '--color-border', label: 'Border' },
  { key: 'chart1', cssVar: '--color-chart-1', label: 'Chart 1' },
  { key: 'chart2', cssVar: '--color-chart-2', label: 'Chart 2' },
  { key: 'chart3', cssVar: '--color-chart-3', label: 'Chart 3' },
  { key: 'chart4', cssVar: '--color-chart-4', label: 'Chart 4' },
  { key: 'chart5', cssVar: '--color-chart-5', label: 'Chart 5' },
] as const;

export type CustomThemeTokenKey = (typeof CUSTOM_THEME_TOKENS)[number]['key'];

export type CustomThemeTokens = Record<CustomThemeTokenKey, string>;

export interface CustomTheme {
  base: BaseThemeId;
  tokens: CustomThemeTokens;
}

/**
 * Seed palettes — the starting point a user gets when they pick a base theme.
 * Values are hex so they round-trip cleanly through `<input type="color">`.
 * `border` is opaque-flattened from the base theme's translucent border onto its
 * background (the colour input cannot represent alpha).
 */
export const THEME_SEEDS: Record<BaseThemeId, CustomThemeTokens> = {
  terminal: {
    background: '#000000',
    foreground: '#e8e8e8',
    card: '#060606',
    primary: '#00d68f',
    success: '#00d68f',
    warning: '#f5a623',
    destructive: '#ff5247',
    border: '#1c1c1c',
    chart1: '#00d68f',
    chart2: '#ff5247',
    chart3: '#849eff',
    chart4: '#b97cff',
    chart5: '#f5a623',
  },
  kraken: {
    background: '#0a0c12',
    foreground: '#eceef5',
    card: '#161a26',
    primary: '#6d5efc',
    success: '#2fd18a',
    warning: '#f5b14c',
    destructive: '#ff5d6c',
    border: '#1c1f29',
    chart1: '#6d5efc',
    chart2: '#2fd18a',
    chart3: '#849eff',
    chart4: '#b97cff',
    chart5: '#ff5d6c',
  },
  leather: {
    background: '#15110b',
    foreground: '#f4ede1',
    card: '#1e1910',
    primary: '#f7931a',
    success: '#6cc296',
    warning: '#f5a623',
    destructive: '#e8775c',
    border: '#2a261d',
    chart1: '#f7931a',
    chart2: '#e8775c',
    chart3: '#6cc296',
    chart4: '#b97cff',
    chart5: '#849eff',
  },
  onyx: {
    background: '#08090b',
    foreground: '#ece7db',
    card: '#0c0e11',
    primary: '#e3b23c',
    success: '#58b58a',
    warning: '#e3b23c',
    destructive: '#db6f5c',
    border: '#232425',
    chart1: '#e3b23c',
    chart2: '#db6f5c',
    chart3: '#58b58a',
    chart4: '#849eff',
    chart5: '#b97cff',
  },
};

export function isBaseThemeId(value: string): value is BaseThemeId {
  return BASE_THEMES.some(theme => theme.id === value);
}

export const DEFAULT_BASE_THEME: BaseThemeId = 'terminal';

export function defaultCustomTheme(): CustomTheme {
  return { base: DEFAULT_BASE_THEME, tokens: { ...THEME_SEEDS[DEFAULT_BASE_THEME] } };
}

/** The next-themes value used for the custom theme. */
export const CUSTOM_THEME_VALUE = 'custom';

function baseThemeClass(base: BaseThemeId): string {
  return `theme-${base}`;
}

/**
 * Apply a custom theme to a root element: add the base theme class (for the
 * inherited tokens) and set inline overrides for every editable token.
 */
export function applyCustomTheme(root: HTMLElement, theme: CustomTheme): void {
  root.classList.add(baseThemeClass(theme.base));
  for (const token of CUSTOM_THEME_TOKENS) {
    root.style.setProperty(token.cssVar, theme.tokens[token.key]);
  }
}

/**
 * Remove a custom theme's footprint from a root element — the base theme class
 * and every inline token override.
 */
export function clearCustomTheme(root: HTMLElement, base: BaseThemeId): void {
  root.classList.remove(baseThemeClass(base));
  for (const token of CUSTOM_THEME_TOKENS) {
    root.style.removeProperty(token.cssVar);
  }
}

/* ----------------------------------------------------------------------------
 * Contrast — a best-effort WCAG check so the editor can warn (never block) when
 * a background/foreground pair is hard to read.
 * ------------------------------------------------------------------------- */

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function parseHex(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  return { r: (value >> 16) & 0xff, g: (value >> 8) & 0xff, b: value & 0xff };
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(rgb: Rgb): number {
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

/** WCAG contrast ratio (1–21) between two hex colours, or null if unparseable. */
export function contrastRatio(hexA: string, hexB: string): number | null {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  if (!a || !b) return null;
  const lumA = relativeLuminance(a);
  const lumB = relativeLuminance(b);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA threshold for normal body text. */
export const MIN_BODY_CONTRAST = 4.5;

export function hasSufficientContrast(hexA: string, hexB: string): boolean {
  const ratio = contrastRatio(hexA, hexB);
  return ratio === null ? true : ratio >= MIN_BODY_CONTRAST;
}
