# ESLint Plugin: Suggest Members

TypeScript ESLint plugin that detects typos when accessing non-existent object properties, imports, and identifiers, suggesting possible corrections.

## Features
- Detects access to non-existent object properties
- Finds errors in imports and identifiers
- Suggests corrections using string similarity algorithms
- Displays up to 5 most probable suggestions
- Shows full method signatures in suggestions

## Installation
```bash
npm install @ton-ai-core/eslint-plugin-suggest-members --save-dev
```

## Configuration

### ESLint Flat Config (JavaScript)
```js
// eslint.config.js
import suggestMembers from '@ton-ai-core/eslint-plugin-suggest-members';

export default [{
  files: ['**/*.ts', '**/*.tsx'],
  plugins: {
    'suggest-members': suggestMembers,
  },
  languageOptions: {
    parser: await import('@typescript-eslint/parser'),
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      project: './tsconfig.json'
    },
  },
  rules: {
    'suggest-members/suggest-members': 'error',
    'suggest-members/suggest-imports': 'error'
  },
}];
```

### ESLint Flat Config (TypeScript)
```ts
// eslint.config.ts
import path from 'path';
import * as tsParser from '@typescript-eslint/parser';
import * as suggestMembers from '@ton-ai-core/eslint-plugin-suggest-members';

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
        project: './tsconfig.json'
      },
    },
    rules: {
      'suggest-members/suggest-members': 'error',
      'suggest-members/suggest-imports': 'error'
    }
  }
];

export default config;
```

> **Важно**: При использовании TypeScript для конфигурации, убедитесь, что ваш `tsconfig.json` включает файл конфигурации:
> ```json
> {
>   "include": ["src/**/*.ts", "eslint.config.ts"]
> }
> ```

### Legacy Config (JavaScript)
```js
// .eslintrc.js
module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ["@ton-ai-core/eslint-plugin-suggest-members"],
  rules: {
    "@ton-ai-core/eslint-plugin-suggest-members/suggest-members": "error",
    "@ton-ai-core/eslint-plugin-suggest-members/suggest-imports": "error"
  }
};
```

### Legacy Config (TypeScript)
```ts
// .eslintrc.ts
/**
 * Legacy ESLint configuration
 */
const config = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ["@ton-ai-core/eslint-plugin-suggest-members"],
  rules: {
    "@ton-ai-core/eslint-plugin-suggest-members/suggest-members": "error",
    "@ton-ai-core/eslint-plugin-suggest-members/suggest-imports": "error"
  }
};

export default config;
```

## Troubleshooting

Если у вас возникли проблемы с настройкой TypeScript конфигурационных файлов, см. [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) для получения дополнительной информации.

## Rules

### suggest-members
Detects access to non-existent properties and suggests similar names.

```typescript
// Error: Property 'fistName' does not exist on type 'User'. Did you mean 'firstName'?
console.log(user.fistName);
```

### suggest-imports
Detects errors in imports and identifiers, suggesting corrections.

```typescript
// Error: '@ton/core' has no exported member named 'Addr1ess'. Did you mean 'Address'?
import { Addr1ess } from "@ton/core";
```

## Similarity Algorithms
- Levenshtein distance
- Damerau-Levenshtein distance
- Jaro-Winkler algorithm
- Abbreviation matching

## License
MIT

## Author
TON AI
