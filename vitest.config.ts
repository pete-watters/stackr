import { defineConfig } from 'vitest/config';

// Root config holds global options (coverage) that apply across the workspace
// projects listed in vitest.workspace.ts. Run `pnpm test:coverage`.
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Unit coverage targets the logic layer. Presentational components
      // (packages/ui), React components, and Next.js pages are covered by
      // Playwright E2E instead, so they are not counted here.
      include: [
        'packages/analytics/src/**',
        'packages/models/src/**',
        'packages/services/src/**',
        'packages/charts/src/**',
        'apps/web/src/lib/**',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.config.{ts,js,mjs,cjs}',
        '**/test-setup.ts',
        '**/test-support/**',
        '**/bdd.ts',
        '**/index.ts',
        '**/*.d.ts',
      ],
      // Thresholds act as a no-regression floor, set just below current
      // actuals. Ratchet upward as the suite grows; never let coverage drop.
      thresholds: {
        statements: 20,
        branches: 60,
        functions: 40,
        lines: 20,
      },
    },
  },
});
