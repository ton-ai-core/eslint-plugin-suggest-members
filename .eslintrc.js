/**
 * .eslintrc.js - Конфигурация ESLint в старом формате
 * Для ESLint < v9.0.0 или при использовании ESLINT_USE_FLAT_CONFIG=false
 */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint', 'suggest-members'],
  rules: {
    'suggest-members/check-member-existence': 'error'
  },
  // Указываем форматтер tact-style как форматтер по умолчанию
  formatter: './formatters/tact-style.js'
}; 