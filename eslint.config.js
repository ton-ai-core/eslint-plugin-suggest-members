/**
 * eslint.config.js - Конфигурация ESLint v9 с Tact-style форматтером
 */
const suggestMembers = require('./dist/index');
const tsParser = require('@typescript-eslint/parser');
const path = require('path');

// Подключаем форматтер Tact-style
const tactStyleFormatter = require('./formatters/tact-style');

/** @type {import('eslint').Linter.FlatConfig[]} */
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

// Устанавливаем Tact-style форматтер по умолчанию
config.format = tactStyleFormatter.format;

module.exports = config;
