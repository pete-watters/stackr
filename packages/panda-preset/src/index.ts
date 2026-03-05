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
    },
  },
});

export default stackrPreset;
