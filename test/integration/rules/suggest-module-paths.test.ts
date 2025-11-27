// CHANGE: Integration tests for suggest-module-paths rule
// WHY: Test module path suggestion functionality with real module scenarios
// PURITY: SHELL (test infrastructure)
// INVARIANT: ∀ path: exists(path) → no_error(import(path))
// INVARIANT: ∀ path: ¬exists(path) ∧ ∃similar: suggest(similar)

import { resolve } from "node:path";
import * as tsParser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { describe } from "vitest";
import { suggestModulePathsRule } from "../../../src/rules/suggest-module-paths/index.js";
import { TEST_CONFIG } from "../../setup.js";
import {
	configureRuleTesterLifecycle,
	createConfiguredRuleTester,
} from "../../utils/rule-tester-base.js";

// CHANGE: Configure RuleTester lifecycle
// WHY: Proper cleanup after tests
configureRuleTesterLifecycle(RuleTester);

// CHANGE: Configure rule tester for module path testing
// WHY: Enable testing with TypeScript parser and module resolution
const ruleTester = createConfiguredRuleTester(tsParser, {
	ecmaVersion: 2020,
	sourceType: "module",
	// Disable project service to avoid tsconfig issues
	// This rule doesn't need type information
});

/**
 * Test suite for suggest-module-paths rule
 *
 * @purity SHELL - test infrastructure
 * @effect File system, RuleTester
 * @invariant ∀ valid_import: ¬error(valid_import)
 * @invariant ∀ invalid_import: error(invalid_import) → suggestions(invalid_import)
 */
describe("suggest-module-paths rule", () => {
	// CHANGE: Get fixture directory path
	// WHY: Need absolute paths for proper file resolution
	const fixturesDir = TEST_CONFIG.FIXTURES_DIR;
	const testFilePath = resolve(fixturesDir, "test.ts");

	ruleTester.run("suggest-module-paths", suggestModulePathsRule, {
		valid: [
			// CHANGE: Valid Node.js built-in module imports
			// WHY: Built-ins should always be valid (not checked by this rule)
			// INVARIANT: ∀ builtin ∈ NodeModules: valid(import(builtin))
			{
				code: `import fs from 'fs';`,
				filename: testFilePath,
			},
			{
				code: `import path from 'path';`,
				filename: testFilePath,
			},
			{
				code: `import { readFile } from 'fs/promises';`,
				filename: testFilePath,
			},
			{
				code: `const crypto = require('crypto');`,
				filename: testFilePath,
			},

			// CHANGE: Valid npm package imports
			// WHY: External packages should not trigger this rule
			// INVARIANT: ∀ pkg ∈ node_modules: valid(import(pkg))
			{
				code: `import { Effect } from 'effect';`,
				filename: testFilePath,
			},
			{
				code: `import * as ts from 'typescript';`,
				filename: testFilePath,
			},

			// CHANGE: Valid relative imports to existing files
			// WHY: These files actually exist in test/fixtures/
			// INVARIANT: ∀ path: exists(resolve(path)) → valid(import(path))
			{
				code: `import { formatString } from './helper';`,
				filename: testFilePath,
			},
			{
				code: `import { formatString } from './helper.ts';`,
				filename: testFilePath,
			},
			{
				code: `import config from './config';`,
				filename: testFilePath,
			},
			{
				code: `import { Calculator } from './calculator';`,
				filename: testFilePath,
			},
			{
				code: `import { formatDate } from './utils/formatter';`,
				filename: testFilePath,
			},
			{
				code: `const helper = require('./helper');`,
				filename: testFilePath,
			},

			// CHANGE: Valid parent directory imports
			// WHY: Test '../' relative imports
			{
				code: `import { createTestContext } from '../setup';`,
				filename: testFilePath,
			},
		],

		invalid: [
			// CHANGE: Test cases for module path typos
			// WHY: Verify rule detects and suggests corrections for path typos
			// NOTE: These now work because validation was changed to Effect.runSync
			{
				code: `import { formatString } from './helpr';`,
				filename: testFilePath,
				errors: [
					{
						messageId: "suggestModulePaths",
						// Full message content verified in real-world E2E test
					},
				],
			},
			{
				code: `import { formatDate } from './formater';`,
				filename: testFilePath,
				errors: [
					{
						messageId: "suggestModulePaths",
						// Full message content verified in real-world E2E test
					},
				],
			},
			{
				code: `import something from './nonexistent';`,
				filename: testFilePath,
				errors: [
					{
						messageId: "suggestModulePaths",
						// Full message content verified in real-world E2E test
					},
				],
			},
		],
	});
});
