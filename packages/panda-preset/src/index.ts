import { definePreset } from '@pandacss/dev';
import { breakpoints } from '@stackr/tokens';
import { semanticTokens } from './semantic-tokens.js';
import { tokens } from './tokens.js';
import { textStyles } from './typography.js';
import { recipes } from './recipes.js';

export const stackrPreset = definePreset({
  name: 'stackr-preset',
  theme: {
    extend: {
      semanticTokens,
      tokens,
      textStyles,
      breakpoints,
      recipes,
      keyframes: {
        shimmer: {
          '0%': { opacity: '0.5' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.5' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
});

export default stackrPreset;
