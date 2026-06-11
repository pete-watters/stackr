import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // jsdom gives us a `window` so we can exercise the browser-only guard in
    // the analytics layer (track/init no-op outside the browser).
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
