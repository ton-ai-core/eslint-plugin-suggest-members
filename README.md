# eslint-plugin-suggest-members

ESLint plugin for TypeScript that detects typos in member access, imports, and identifiers and suggests corrections.

## Features

- Detects non-existent object properties/methods
- Identifies import errors
- Suggests corrections using string similarity algorithms
- Displays full method signatures in suggestions

## Installation

```bash
npm install eslint-plugin-suggest-members --save-dev
```

## Configuration

### ESLint Flat Config (ESLint v9+)

```js
// eslint.config.js
import suggestMembers from 'eslint-plugin-suggest-members';

export default [
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
        project: './tsconfig.json',
      },
    },
    rules: {
      'suggest-members/suggest-members': 'error',
      'suggest-members/suggest-imports': 'error'
    }
  }
];
```

### Legacy Config

```js
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['suggest-members'],
  rules: {
    'suggest-members/suggest-members': 'error',
    'suggest-members/suggest-imports': 'error'
  }
};
```

## Rules

### suggest-members

Detects access to non-existent properties/methods on objects and suggests similar names.

Example:
```typescript
// Error: Property "fooo" does not exist on type "MyClass". Did you mean:
// - foo: number
// - processData(data: string): string
// - getFullName(): string
console.log(obj.fooo);
```

### suggest-imports

Detects errors in imports and undefined identifiers.

Example:
```typescript
// Error: Import "Bufffer" is not defined in module "fs". Did you mean:
// - Buffer
// - readFile
// - writeFile
import { Bufffer } from 'fs';
```

## Requirements

- Node.js 14.x or higher
- ESLint 8.x or higher
- TypeScript 4.x or higher

## License

MIT
