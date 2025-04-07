# ESLint Plugin: suggest-members

An ESLint plugin that suggests potential corrections when accessing non-existent object members or using incorrect imports in TypeScript.

## Features

- 🔍 **Member Suggestion**: Suggests possible member names when accessing non-existent properties on objects
- 📦 **Import Correction**: Suggests possible exports when using incorrect import names
- 💡 **Smart Suggestions**: Uses multiple similarity algorithms including Jaro-Winkler to find the most relevant suggestions
- 🛠️ **Automatic Fixes**: Offers automatic fixes for typos in member names and imports

## Installation

```bash
npm install --save-dev @ton-ai-core/eslint-plugin-suggest-members
# or
yarn add --dev @ton-ai-core/eslint-plugin-suggest-members
```

This plugin requires:
- ESLint v7.0.0+
- TypeScript v4.0.0+
- @typescript-eslint/parser v5.0.0+

## Usage

### ESLint v9 (Flat Config)

```js
// eslint.config.js or eslint.config.mjs
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import * as path from 'path';
import suggestMembersPlugin from "@ton-ai-core/eslint-plugin-suggest-members";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: path.resolve(),
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "suggest-members": suggestMembersPlugin
    },
    rules: {
      "suggest-members/suggest-members": "error",
      "suggest-members/suggest-imports": "error"
    }
  }
];
```

### ESLint v8 and earlier (Traditional Config)

```js
// .eslintrc.js
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
    'suggest-members/suggest-members': 'error',
    'suggest-members/suggest-imports': 'error'
  }
};
```

## Available Rules

### suggest-members/suggest-members

Suggests similar property/method names when accessing non-existent members on an object.

Example:
```ts
class User {
  firstName: string;
  lastName: string;
  getFullName(): string {
    return this.firstName + ' ' + this.lastName;
  }
}

const user = new User();
user.getFullNam(); // Error: Property "getFullNam" does not exist on type "User". Did you mean: "getFullName"?
```

### suggest-members/suggest-imports

Suggests possible exports when trying to import a non-existent symbol from a module.

Example:
```ts
import { readFil } from 'fs'; // Error: Import "readFil" is not defined in module "fs". Did you mean: "readFile"?
```

## Configuration

Both rules can be configured as:
- `"error"` - Report errors (recommended for catching bugs)
- `"warn"` - Report warnings
- `"off"` - Disable the rule

## License

MIT
