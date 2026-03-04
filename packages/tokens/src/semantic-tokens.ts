/**
 * Semantic tokens bridge raw palette values to theme-aware tokens.
 * Shape: { value: { base: lightValue, _dark: darkValue } }
 *
 * Following Leather's pattern: a helper function creates the conditional
 * object for each palette key, making it trivial to wire into Panda CSS
 * or any other theming system.
 */
import type { Palette } from './colors.js';
import { colorThemes } from './colors.js';

type SemanticToken = { value: { base: string; _dark: string } };

function token<K extends keyof Palette>(key: K): SemanticToken {
  return { value: { base: colorThemes.base[key], _dark: colorThemes.dark[key] } };
}

export const semanticTokens = {
  colors: {
    ink: {
      'text-primary': token('ink.text-primary'),
      'text-secondary': token('ink.text-secondary'),
      'text-muted': token('ink.text-muted'),
      'action-primary-default': token('ink.action-primary-default'),
      'action-primary-hover': token('ink.action-primary-hover'),
      'border-default': token('ink.border-default'),
      'border-subtle': token('ink.border-subtle'),
      'component-bg-default': token('ink.component-bg-default'),
      'component-bg-hover': token('ink.component-bg-hover'),
      'component-bg-pressed': token('ink.component-bg-pressed'),
      'bg-overlay': token('ink.bg-overlay'),
      'bg-secondary': token('ink.bg-secondary'),
      'bg-primary': token('ink.bg-primary'),
    },
    accent: {
      'solid-default': token('accent.solid-default'),
      'solid-hover': token('accent.solid-hover'),
      text: token('accent.text'),
      border: token('accent.border'),
      'bg-subtle': token('accent.bg-subtle'),
    },
    success: {
      'solid-default': token('success.solid-default'),
      text: token('success.text'),
      border: token('success.border'),
      'bg-subtle': token('success.bg-subtle'),
    },
    warning: {
      'solid-default': token('warning.solid-default'),
      text: token('warning.text'),
      border: token('warning.border'),
      'bg-subtle': token('warning.bg-subtle'),
    },
    error: {
      'solid-default': token('error.solid-default'),
      text: token('error.text'),
      border: token('error.border'),
      'bg-subtle': token('error.bg-subtle'),
    },
    chain: {
      btc: token('chain.btc'),
      stx: token('chain.stx'),
      eth: token('chain.eth'),
      sol: token('chain.sol'),
    },
  },
};
