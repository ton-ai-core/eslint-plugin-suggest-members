// CHANGE: Integration tests for suggest-imports rule
// WHY: Test import suggestion functionality with real import scenarios
// PURITY: SHELL (test infrastructure)

import * as tsParser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { suggestImportsRule } from "../../../src/rules/suggest-imports/index.js";
import { TEST_CONFIG } from "../../setup.js";

// CHANGE: Configure rule tester for TypeScript imports
// WHY: Enable testing with TypeScript parser and module resolution
const ruleTester = new RuleTester({
	languageOptions: {
		parser: tsParser,
		parserOptions: TEST_CONFIG.PARSER_OPTIONS,
	},
});

// CHANGE: Test rule with valid and invalid import examples
// WHY: Verify complete import suggestion functionality
ruleTester.run("suggest-imports", suggestImportsRule, {
	valid: [
		// Valid imports
		`import fs from 'fs';`,
		`import path from 'path';`,
		`import * as fs from 'fs';`,
		`import { readFileSync } from 'fs';`,
		// Valid named imports
		`import { resolve } from 'path';`,
		`import { createReadStream } from 'fs';`,
	],
	invalid: [
		// CHANGE: Test cases for import name typos
		// WHY: Verify rule suggests corrections for mistyped import names
		// NOTE: Rule works when TypeScript reports import resolution errors

		// Test fs module import typos
		{
			code: `import { readFileSynk } from 'fs';`,
			errors: [
				{
					messageId: "suggestImports",
					// Should suggest 'readFileSync'
				},
			],
		},
		{
			code: `import { readdirSynk } from 'fs';`,
			errors: [
				{
					messageId: "suggestImports",
					// Should suggest 'readdirSync'
				},
			],
		},

		// Test path module import typos
		{
			code: `import { resolvee } from 'path';`,
			errors: [
				{
					messageId: "suggestImports",
					// Should suggest 'resolve'
				},
			],
		},

		// Test multiple typos
		{
			code: `import { readFileSynk, writeFileSynk } from 'fs';`,
			errors: [
				{
					messageId: "suggestImports",
					// Should suggest 'readFileSync'
				},
				{
					messageId: "suggestImports",
					// Should suggest 'writeFileSync'
				},
			],
		},
	],
});
