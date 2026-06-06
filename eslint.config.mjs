import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Base: JS recommended rules (applies to all files)
  eslint.configs.recommended,

  // TypeScript: recommended rules for core source and tests
  ...tseslint.configs['flat/recommended'].map((cfg) => ({
    ...cfg,
    files: ['src/**/*.ts', 'tests/**/*.ts'],
  })),

  // Parser options enabling type-checked lint rules
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },

  // Prettier integration (applies everywhere)
  {
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },

  // Type-checked rules (enabled selectively — they require parserOptions.project)
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },

  // Jest / test global variables
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        Headers: 'readonly',
        fetch: 'readonly',
        ReadableStream: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
      },
    },
  },

  // Examples (standalone packages – no shared tsconfig, no type-checking)
  {
    files: ['examples/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      'no-unused-vars': 'off',
    },
  },

  // Global rule overrides (applied last, to all files)
  {
    rules: {
      'prefer-const': 'error',
    },
  },

  // Directories / files to ignore
  {
    ignores: ['dist/', 'node_modules/', '*.js', '*.cjs'],
  },
];
