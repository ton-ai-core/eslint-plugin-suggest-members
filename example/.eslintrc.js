module.exports = [
  {
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      'suggest-members': require('../dist'),
    },
    rules: {
      'suggest-members/suggest-members': 'error',
      'suggest-members/suggest-imports': 'error'
    },
  }
]; 