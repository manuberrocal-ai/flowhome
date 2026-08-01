import js from '@eslint/js';
import globals from 'globals';
import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

const runtimeGlobals = { ...globals.browser, ...globals.node };

export default [
  {
    ignores: ['.astro/**', 'dist/**', 'node_modules/**', 'coverage/**'],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      globals: runtimeGlobals,
    },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,mts,cts}'],
    rules: {
      ...config.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  })),
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  ...eslintPluginAstro.configs.recommended,
  {
    files: ['**/*.astro'],
    languageOptions: {
      globals: runtimeGlobals,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
