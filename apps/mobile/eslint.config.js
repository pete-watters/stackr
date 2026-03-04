import { react } from '@stackr/eslint-config';

export default [
  ...react,
  {
    files: ['metro.config.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'writable',
        __dirname: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
