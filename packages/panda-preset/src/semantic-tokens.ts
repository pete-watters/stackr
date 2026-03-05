import { defineSemanticTokens } from '@pandacss/dev';
import { semanticTokens as tokenSemantics } from '@stackr/tokens';

export const semanticTokens = defineSemanticTokens({
  ...tokenSemantics,
});
