/**
 * eslint.config.ts для примеров
 */
import path from 'path';
import * as tsParser from '@typescript-eslint/parser';
import * as suggestMembers from '../src/index';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      'suggest-members': suggestMembers
    },
    languageOptions: {
      parser: tsParser,
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