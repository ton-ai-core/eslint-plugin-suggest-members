// Test ESLint config to verify suggest-module-paths rule works
import tseslint from 'typescript-eslint';
import suggestMembers from "@ton-ai-core/eslint-plugin-suggest-members";
import { defineConfig } from 'eslint/config';

export default defineConfig(
	suggestMembers.configs.recommended,
	{
	  languageOptions: {
		parser: tseslint.parser,
		parserOptions: {
		  projectService: true,          
		  tsconfigRootDir: import.meta.dirname,
		},
	  },
	  files: ["**/*.ts"],
	},
);