/**
 * eslint.config.ts - Конфигурация ESLint v9
 */
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import * as path from 'path';
// Import directly from src as ESM module during development
import suggestMembersPlugin from "./src/index";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}", "example/**/*.{ts,tsx}", "**/*.test.ts"],
    ignores: ["dist/**/*"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json", "./example/tsconfig.json"],
        tsconfigRootDir: path.resolve(),
        sourceType: "module"
      },
      globals: {
        console: true,
        __dirname: true,
        process: true
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "suggest-members": suggestMembersPlugin
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "suggest-members/suggest-members": "error",
      "suggest-members/suggest-imports": "error",
      "suggest-members/suggest-module-paths": "error"
    },
  },
  {
    files: ["**/*.test.ts"],
    languageOptions: {
      globals: {
        describe: true,
        test: true,
        expect: true,
        jest: true
      }
    }
  }
]; 