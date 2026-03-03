import { definePreset } from '@pandacss/dev';
import { tokens } from './tokens.js';
import { semanticTokens } from './semantic-tokens.js';
import { recipes } from './recipes.js';

export const stackrPreset = definePreset({
  name: 'stackr-preset',
  theme: {
    extend: {
      tokens,
      semanticTokens,
      recipes,
    },
  },
});

export default stackrPreset;
