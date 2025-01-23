import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import tsParser from '@typescript-eslint/parser';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
  },
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      prettier: prettier,
    },
  },
  {
    rules: {
      'prettier/prettier': 'error',
      ...eslint.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
    },
  },
];
