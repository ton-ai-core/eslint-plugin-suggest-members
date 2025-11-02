// Test ESLint config to verify suggest-module-paths rule works
import tsParser from "@typescript-eslint/parser";
import suggestMembers from "../dist/index.js";

export default [
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: "module",
				project: "./tsconfig.json",
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			"@ton-ai-core/suggest-members": suggestMembers,
		},
		rules: {
			"@ton-ai-core/suggest-members/suggest-module-paths": "error",
			"@ton-ai-core/suggest-members/suggest-imports": "error",
			"@ton-ai-core/suggest-members/suggest-exports": "error",
			"@ton-ai-core/suggest-members/suggest-members": "error",
		},
	},
];
