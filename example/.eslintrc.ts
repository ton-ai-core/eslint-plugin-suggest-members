/**
 * Конфигурация ESLint для примеров
 */
// @ts-ignore импортируем парсер
import tsParser = require('@typescript-eslint/parser');
// @ts-ignore импортируем eslint-плагин
import tsEslintPlugin = require('@typescript-eslint/eslint-plugin');
// @ts-ignore импортируем наш плагин из исходников
import suggestMembers = require('../src');

export = [
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
      'suggest-members': suggestMembers,
    },
    rules: {
      'suggest-members/suggest-members': 'error',
      'suggest-members/suggest-imports': 'error'
    },
  }
]; 