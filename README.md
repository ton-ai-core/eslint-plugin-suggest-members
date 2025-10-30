# ESLint Plugin: suggest-members

An ESLint plugin that suggests corrections for typos in properties, variables, and import paths.

## Examples

```ts
// Export errors
Module 'react' does not export 'useStae'. Did you mean:
  - useState
  - useRef
  - useEffect
  - useMemo

// Member errors
Property "get1Item" does not exist on type "Storage". Did you mean:
  - getItem(key: string): string | null
  - setItem(key: string, value: string)
  - removeItem(key: string)

// Module path errors
Cannot find module "./HamsterKo1mbatPage.css". Did you mean:
  - ./HamsterKombatPage.css
  - ./HamsterKombatPage.tsx
  - ./HamsterKombatPage
  - ./
  - ../ThemeParamsPage

// Variable errors
Variable "saveRe1f" is not defined. Did you mean:
  - saveRef
  - saveState
  - state
  - screen
  - Screen
```

## Install

```bash
npm i -D @ton-ai-core/eslint-plugin-suggest-members
```

## Usage

```js
// eslint.config.js (ESLint v9+)
import suggestMembers from "@ton-ai-core/eslint-plugin-suggest-members";

export default [{
  files: ["**/*.ts"],
  plugins: { "suggest-members": suggestMembers },
  rules: {
    "suggest-members/suggest-exports": "error",
    "suggest-members/suggest-imports": "error", 
    "suggest-members/suggest-members": "error",
    "suggest-members/suggest-module-paths": "error"
  }
}];
```

## License

MIT
