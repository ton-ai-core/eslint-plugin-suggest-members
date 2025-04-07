/**
 * eslint.config.ts - Конфигурация ESLint v9
 */
import path from 'path';
import * as tsParser from '@typescript-eslint/parser';

// Импортируем плагин из исходников
import * as suggestMembers from './src/index';

const config = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['node_modules/**', 'dist/**/*.d.ts'],
    plugins: {
      'suggest-members': suggestMembers
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: [
          './tsconfig.json',
          './example/tsconfig.json'
        ]
      },
    },
    rules: {
      'suggest-members/check-member-existence': 'error'
    }
  }
];

export default config; 