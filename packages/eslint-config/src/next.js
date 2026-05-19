import nextPlugin from '@next/eslint-plugin-next';
import { react } from './react.js';

/** @type {import("eslint").Linter.Config[]} */
export const next = [
  ...react,
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
];

export default next;
