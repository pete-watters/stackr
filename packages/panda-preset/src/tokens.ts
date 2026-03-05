import { defineTokens } from '@pandacss/dev';
import { fonts, radii, spacing, zIndices } from '@stackr/tokens';
import { colors } from './colors.js';

export const tokens = defineTokens({
  colors,
  fonts,
  radii,
  spacing,
  zIndex: zIndices,
});
