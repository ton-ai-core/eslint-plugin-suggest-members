# suggest-exports Rule

## Overview

The `suggest-exports` rule detects typos in import statements and suggests similar export names from the target module.

## Mathematical Properties

**Invariant**: `∀ import: exists(export) ∨ suggest(similar_exports)`

For every import statement, either:
1. The imported name exists in the module (valid case)
2. Similar export names are suggested (typo case)

**Complexity**: `O(n log n)` where `n = |available_exports|`

## Examples

### ❌ Incorrect (triggers rule)

```typescript
// Typo in React hook
import { useStae } from 'react';
// → Suggests: useState, useRef, useEffect, useMemo

// Typo in Node.js fs module  
import { readFil } from 'fs';
// → Suggests: readFile, readdir, readSync

// Multiple typos
import { useStae, useEfect } from 'react';
// → Suggests corrections for both
```

### ✅ Correct (no errors)

```typescript
import { useState, useEffect } from 'react';
import { readFile, writeFile } from 'fs';
import type { SomeType } from './types'; // Type imports ignored
import React from 'react'; // Default imports ignored
import * as fs from 'fs'; // Namespace imports ignored
```

## Configuration

```javascript
// eslint.config.js
export default [{
  files: ["**/*.ts", "**/*.tsx"],
  plugins: { "suggest-members": suggestMembers },
  rules: {
    "suggest-members/suggest-exports": "error"
  }
}];
```

## Algorithm

1. **Parse Import**: Extract named import specifiers
2. **Skip Special Cases**: Type-only imports, default imports, namespace imports
3. **Get Module Exports**: Query TypeScript compiler for available exports
4. **Check Existence**: Verify if imported name exists
5. **Find Similarities**: Use composite similarity scoring (Jaro-Winkler + Jaccard + containment)
6. **Filter Candidates**: Remove private exports (`_*`), internal symbols (`__*`), exact matches
7. **Rank Suggestions**: Sort by similarity score, limit to top 5
8. **Format Message**: Create user-friendly error message with suggestions

## Similarity Scoring

Uses composite algorithm combining:
- **Jaro-Winkler**: Character-level similarity with prefix bonus
- **Jaccard**: Set-based similarity of character n-grams  
- **Containment**: Substring matching
- **Length Penalty**: Penalizes significant length differences

**Formula**: `score = 0.5×jw + 0.3×jaccard + 0.1×containment + 0.1×prefix - penalty`

## Architecture

Follows **Functional Core, Imperative Shell (FCIS)** pattern:

- **CORE**: Pure similarity algorithms, validation predicates
- **SHELL**: ESLint integration, TypeScript Compiler API effects

All functions are mathematically pure with documented invariants and complexity guarantees.

## Testing

- **Unit Tests**: Verify rule behavior with RuleTester
- **Property Tests**: Mathematical invariants with fast-check
- **Integration Tests**: Real ESLint environment testing

## Related Rules

- `suggest-members`: Property access typos
- `suggest-imports`: Module import path typos  
- `suggest-module-paths`: File path typos