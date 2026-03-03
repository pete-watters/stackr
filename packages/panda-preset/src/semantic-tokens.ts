import { defineSemanticTokens } from '@pandacss/dev';

export const semanticTokens = defineSemanticTokens({
  colors: {
    bg: {
      primary: { value: { base: '{colors.gray.50}', _dark: '{colors.gray.950}' } },
      secondary: { value: { base: '{colors.gray.100}', _dark: '{colors.gray.800}' } },
      card: { value: { base: '{colors.gray.100}', _dark: '{colors.gray.800}' } },
      input: { value: { base: 'white', _dark: '{colors.gray.900}' } },
    },
    text: {
      primary: { value: { base: '{colors.gray.900}', _dark: '{colors.gray.50}' } },
      secondary: { value: { base: '{colors.gray.600}', _dark: '{colors.gray.400}' } },
      muted: { value: { base: '{colors.gray.400}', _dark: '{colors.gray.500}' } },
    },
    border: {
      DEFAULT: { value: { base: '{colors.gray.200}', _dark: '{colors.gray.700}' } },
    },
    accent: {
      DEFAULT: { value: '{colors.brand.500}' },
      hover: { value: '{colors.brand.600}' },
    },
    success: { value: '{colors.green.500}' },
    error: { value: '{colors.red.500}' },
  },
});
