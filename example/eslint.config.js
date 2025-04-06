const path = require('path');
const fs = require('fs');

// Используем локальную версию плагина
const suggestMembers = require('../dist/index.js').default;

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      'suggest-members': suggestMembers
    },
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: path.resolve(__dirname, './tsconfig.json'),
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      'suggest-members/suggest-members': 'error',
      'suggest-members/suggest-imports': 'error'
    }
  }
]; 