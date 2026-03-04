/**
 * Raw color palette built on Radix UI color scales.
 *
 * We use `gray` for neutrals (pure neutral, no warm/cool tint) and map
 * Radix's 12-step scales to our semantic Palette interface.
 *
 * Radix scale mapping:
 *   1-2:  Backgrounds
 *   3-5:  Component backgrounds (default, hover, pressed)
 *   6-7:  Borders
 *   8:    Solid borders / focus rings
 *   9-10: Solid backgrounds (default, hover)
 *   11:   Low-contrast text
 *   12:   High-contrast text
 */
import {
  gray,
  grayDark,
  blue,
  blueDark,
  red,
  redDark,
  amber,
  amberDark,
  green,
  greenDark,
  grayA,
  grayDarkA,
} from '@radix-ui/colors';

export interface Palette {
  // Ink (neutral) — primary UI chrome
  'ink.text-primary': string;
  'ink.text-secondary': string;
  'ink.text-muted': string;
  'ink.action-primary-default': string;
  'ink.action-primary-hover': string;
  'ink.border-default': string;
  'ink.border-subtle': string;
  'ink.component-bg-default': string;
  'ink.component-bg-hover': string;
  'ink.component-bg-pressed': string;
  'ink.bg-overlay': string;
  'ink.bg-secondary': string;
  'ink.bg-primary': string;

  // Accent (brand / interactive)
  'accent.solid-default': string;
  'accent.solid-hover': string;
  'accent.text': string;
  'accent.border': string;
  'accent.bg-subtle': string;

  // Success (green)
  'success.solid-default': string;
  'success.text': string;
  'success.border': string;
  'success.bg-subtle': string;

  // Warning (amber)
  'warning.solid-default': string;
  'warning.text': string;
  'warning.border': string;
  'warning.bg-subtle': string;

  // Error (red)
  'error.solid-default': string;
  'error.text': string;
  'error.border': string;
  'error.bg-subtle': string;

  // Chain brand colors
  'chain.btc': string;
  'chain.stx': string;
  'chain.eth': string;
  'chain.sol': string;
}

export const lightPalette: Palette = {
  // Ink — mapped from Radix gray (light)
  'ink.text-primary': gray.gray12,
  'ink.text-secondary': gray.gray11,
  'ink.text-muted': gray.gray9,
  'ink.action-primary-default': gray.gray12,
  'ink.action-primary-hover': gray.gray11,
  'ink.border-default': gray.gray6,
  'ink.border-subtle': gray.gray4,
  'ink.component-bg-default': gray.gray3,
  'ink.component-bg-hover': gray.gray4,
  'ink.component-bg-pressed': gray.gray5,
  'ink.bg-overlay': grayA.grayA11,
  'ink.bg-secondary': gray.gray2,
  'ink.bg-primary': gray.gray1,

  // Accent — blue
  'accent.solid-default': blue.blue9,
  'accent.solid-hover': blue.blue10,
  'accent.text': blue.blue11,
  'accent.border': blue.blue7,
  'accent.bg-subtle': blue.blue3,

  // Success — green
  'success.solid-default': green.green9,
  'success.text': green.green11,
  'success.border': green.green7,
  'success.bg-subtle': green.green3,

  // Warning — amber
  'warning.solid-default': amber.amber9,
  'warning.text': amber.amber11,
  'warning.border': amber.amber7,
  'warning.bg-subtle': amber.amber3,

  // Error — red
  'error.solid-default': red.red9,
  'error.text': red.red11,
  'error.border': red.red7,
  'error.bg-subtle': red.red3,

  // Chain brand colors
  'chain.btc': '#F7931A',
  'chain.stx': '#5546FF',
  'chain.eth': '#627EEA',
  'chain.sol': '#9945FF',
};

export const darkPalette: Palette = {
  // Ink — mapped from Radix gray (dark)
  'ink.text-primary': grayDark.gray12,
  'ink.text-secondary': grayDark.gray11,
  'ink.text-muted': grayDark.gray9,
  'ink.action-primary-default': grayDark.gray12,
  'ink.action-primary-hover': grayDark.gray11,
  'ink.border-default': grayDark.gray6,
  'ink.border-subtle': grayDark.gray4,
  'ink.component-bg-default': grayDark.gray3,
  'ink.component-bg-hover': grayDark.gray4,
  'ink.component-bg-pressed': grayDark.gray5,
  'ink.bg-overlay': grayDarkA.grayA11,
  'ink.bg-secondary': grayDark.gray2,
  'ink.bg-primary': grayDark.gray1,

  // Accent — blue (dark)
  'accent.solid-default': blueDark.blue9,
  'accent.solid-hover': blueDark.blue10,
  'accent.text': blueDark.blue11,
  'accent.border': blueDark.blue7,
  'accent.bg-subtle': blueDark.blue3,

  // Success — green (dark)
  'success.solid-default': greenDark.green9,
  'success.text': greenDark.green11,
  'success.border': greenDark.green7,
  'success.bg-subtle': greenDark.green3,

  // Warning — amber (dark)
  'warning.solid-default': amberDark.amber9,
  'warning.text': amberDark.amber11,
  'warning.border': amberDark.amber7,
  'warning.bg-subtle': amberDark.amber3,

  // Error — red (dark)
  'error.solid-default': redDark.red9,
  'error.text': redDark.red11,
  'error.border': redDark.red7,
  'error.bg-subtle': redDark.red3,

  // Chain brand colors (same in both themes)
  'chain.btc': '#F7931A',
  'chain.stx': '#7F80FF',
  'chain.eth': '#849EFF',
  'chain.sol': '#B97CFF',
};

export const colorThemes = {
  base: lightPalette,
  dark: darkPalette,
} as const;
