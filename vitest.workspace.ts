import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'apps/web/vitest.config.ts',
  'packages/models/vitest.config.ts',
  'packages/charts/vitest.config.ts',
]);
