import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'coverage/', 'custom-elements.json'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      'no-unused-vars': [
        'error',
        { args: 'after-used', argsIgnorePattern: '^_' }
      ],
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  }
];
