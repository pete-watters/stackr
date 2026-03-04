import { defineConfig } from '@pandacss/dev';
import { stackrPreset } from '@stackr/panda-preset';

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets', stackrPreset],
  include: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  exclude: [],
  theme: {
    extend: {},
  },
  jsxFramework: 'react',
  outdir: 'styled-system',
  conditions: {
    dark: '[data-theme="dark"] &, .dark &',
  },
});
