import globals from 'globals';

import root from '../../eslint.config.mjs';

export default [
  ...root,
  {
    files: ['babel.config.js', 'metro.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
];
