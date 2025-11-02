# 📝 ESLint Configuration Examples

## 🚀 **Quick Start Configurations**

### **Minimal Setup (ESLint v9)**
```javascript
// eslint.config.js
import suggestMembers from "@ton-ai-core/eslint-plugin-suggest-members";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "suggest-members": suggestMembers },
    rules: {
      "suggest-members/suggest-members": "error"
    }
  }
];
```

### **Full Setup (All Rules)**
```javascript
// eslint.config.js
import suggestMembers from "@ton-ai-core/eslint-plugin-suggest-members";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    plugins: { 
      "suggest-members": suggestMembers 
    },
    rules: {
      "suggest-members/suggest-exports": "error",
      "suggest-members/suggest-imports": "error", 
      "suggest-members/suggest-members": "error",
      "suggest-members/suggest-module-paths": "error"
    }
  }
];
```

## 🎯 **Framework-Specific Configurations**

### **React + TypeScript**
```javascript
// eslint.config.js
import suggestMembers from "@ton-ai-core/eslint-plugin-suggest-members";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: { 
      "suggest-members": suggestMembers,
      "react": reactPlugin
    },
    rules: {
      // Suggest Members rules
      "suggest-members/suggest-exports": "error",
      "suggest-members/suggest-imports": "error", 
      "suggest-members/suggest-members": "error",
      "suggest-members/suggest-module-paths": "error",
      
      // React rules
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error"
    }
  }
];
```

### **Next.js Project**
```javascript
// eslint.config.js
import suggestMembers from "@ton-ai-core/eslint-plugin-suggest-members";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    plugins: { 
      "suggest-members": suggestMembers 
    },
    rules: {
      "suggest-members/suggest-exports": "error",
      "suggest-members/suggest-imports": "error", 
      "suggest-members/suggest-members": "error",
      "suggest-members/suggest-module-paths": "error"
    }
  },
  {
    // Special config for Next.js pages
    files: ["pages/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    rules: {
      "suggest-members/suggest-module-paths": "warn" // Less strict for dynamic imports
    }
  }
];
```

### **Node.js + Express**
```javascript
// eslint.config.js
import suggestMembers from "@ton-ai-core/eslint-plugin-suggest-members";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json"
      },
      globals: {
        node: true
      }
    },
    plugins: { 
      "suggest-members": suggestMembers 
    },
    rules: {
      "suggest-members/suggest-exports": "error",
      "suggest-members/suggest-imports": "error", 
      "suggest-members/suggest-members": "error",
      "suggest-members/suggest-module-paths": "error"
    }
  }
];
```

## 🔧 **Advanced Configurations**

### **Monorepo Setup**
```javascript
// eslint.config.js (root)
import suggestMembers from "@ton-ai-core/eslint-plugin-suggest-members";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["packages/*/src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["packages/*/tsconfig.json"]
      }
    },
    plugins: { 
      "suggest-members": suggestMembers 
    },
    rules: {
      "suggest-members/suggest-exports": "error",
      "suggest-members/suggest-imports": "error", 
      "suggest-members/suggest-members": "error",
      "suggest-members/suggest-module-paths": "error"
    }
  },
  {
    // Different rules for test files
    files: ["packages/*/src/**/*.test.{ts,tsx}"],
    rules: {
      "suggest-members/suggest-members": "warn" // Less strict in tests
    }
  }
];
```

### **Legacy ESLint v8 (JSON Config)**
```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "plugins": ["@ton-ai-core/suggest-members"],
  "rules": {
    "@ton-ai-core/suggest-members/suggest-exports": "error",
    "@ton-ai-core/suggest-members/suggest-imports": "error",
    "@ton-ai-core/suggest-members/suggest-members": "error",
    "@ton-ai-core/suggest-members/suggest-module-paths": "error"
  },
  "overrides": [
    {
      "files": ["*.test.ts", "*.spec.ts"],
      "rules": {
        "@ton-ai-core/suggest-members/suggest-members": "warn"
      }
    }
  ]
}
```

## 🎛️ **Rule-Specific Configurations**

### **Only TypeScript Files**
```javascript
export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { "suggest-members": suggestMembers },
    rules: {
      "suggest-members/suggest-members": "error" // Only for TS files
    }
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    plugins: { "suggest-members": suggestMembers },
    rules: {
      "suggest-members/suggest-module-paths": "error" // Only filesystem for JS
    }
  }
];
```

### **Gradual Adoption**
```javascript
export default [
  {
    files: ["src/new-features/**/*.ts"],
    plugins: { "suggest-members": suggestMembers },
    rules: {
      // Strict rules for new code
      "suggest-members/suggest-exports": "error",
      "suggest-members/suggest-imports": "error", 
      "suggest-members/suggest-members": "error",
      "suggest-members/suggest-module-paths": "error"
    }
  },
  {
    files: ["src/legacy/**/*.ts"],
    plugins: { "suggest-members": suggestMembers },
    rules: {
      // Warnings only for legacy code
      "suggest-members/suggest-exports": "warn",
      "suggest-members/suggest-imports": "warn", 
      "suggest-members/suggest-members": "warn",
      "suggest-members/suggest-module-paths": "warn"
    }
  }
];
```

## 🚨 **Troubleshooting Configurations**

### **TypeScript Project Not Found**
```javascript
// If you get "Cannot find TypeScript project" errors
export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true, // Auto-detect tsconfig.json
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: { "suggest-members": suggestMembers },
    rules: {
      "suggest-members/suggest-members": "error"
    }
  }
];
```

### **Performance Issues (Large Projects)**
```javascript
export default [
  {
    files: ["**/*.ts"],
    plugins: { "suggest-members": suggestMembers },
    rules: {
      // Disable TypeScript-heavy rules for performance
      "suggest-members/suggest-exports": "off",
      "suggest-members/suggest-imports": "off", 
      "suggest-members/suggest-members": "warn", // Keep but as warning
      "suggest-members/suggest-module-paths": "error" // Filesystem only
    }
  }
];
```

### **CI/CD Optimized**
```javascript
// Different config for CI vs development
const isCI = process.env.CI === 'true';

export default [
  {
    files: ["**/*.ts"],
    plugins: { "suggest-members": suggestMembers },
    rules: {
      "suggest-members/suggest-exports": isCI ? "warn" : "error",
      "suggest-members/suggest-imports": isCI ? "warn" : "error", 
      "suggest-members/suggest-members": isCI ? "warn" : "error",
      "suggest-members/suggest-module-paths": "error"
    }
  }
];
```

## 📚 **Integration Examples**

### **With Prettier**
```javascript
// eslint.config.js
import suggestMembers from "@ton-ai-core/eslint-plugin-suggest-members";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    files: ["**/*.ts"],
    plugins: { "suggest-members": suggestMembers },
    rules: {
      "suggest-members/suggest-members": "error"
    }
  },
  prettierConfig // Disables conflicting rules
];
```

### **With Husky + lint-staged**
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
npx lint-staged
```