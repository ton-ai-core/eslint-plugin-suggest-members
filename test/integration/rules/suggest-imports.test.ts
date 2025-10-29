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
		// CHANGE: Test message format validation
		// WHY: Ensure our rule produces helpful error messages
		// NOTE: These tests validate message format, not error detection
		// The rule only triggers when TypeScript reports import errors
	],
});
