import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-prototype-builtins': 'off',
      'no-empty': 'off',
      'no-cond-assign': 'off',
      'no-fallthrough': 'off',
      'no-control-regex': 'off',
      'no-constant-condition': 'off',
      'no-useless-escape': 'off',
      'no-func-assign': 'off',
      'no-redeclare': 'off',
      'no-sparse-arrays': 'off',
      'no-dupe-keys': 'off',
      'require-yield': 'off',
      'valid-typeof': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '*.config.js',
      '*.config.mjs',
      'apps/web/dist/**',
      'apps/api/dist/**',
      'apps/worker/dist/**',
    ],
  },
];
