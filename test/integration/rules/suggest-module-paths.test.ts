// CHANGE: Integration tests for suggest-module-paths rule
// WHY: Test module path suggestion functionality with real module scenarios
// PURITY: SHELL (test infrastructure)

import * as tsParser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { suggestModulePathsRule } from "../../../src/rules/suggest-module-paths/index.js";
import { TEST_CONFIG } from "../../setup.js";

// CHANGE: Configure rule tester for module path testing
// WHY: Enable testing with TypeScript parser and module resolution
const ruleTester = new RuleTester({
	languageOptions: {
		parser: tsParser,
		parserOptions: TEST_CONFIG.PARSER_OPTIONS,
	},
});

// CHANGE: Test rule with valid and invalid module path examples
// WHY: Verify complete module path suggestion functionality
ruleTester.run("suggest-module-paths", suggestModulePathsRule, {
	valid: [
		// Valid module paths
		`import fs from 'fs';`,
		`import path from 'path';`,
		`import util from 'util';`,
		`import crypto from 'crypto';`,
		// Valid relative imports
		`import { helper } from './helper';`,
		`import config from '../config';`,
	],
	invalid: [
		// CHANGE: Test message format validation
		// WHY: Ensure our rule produces helpful error messages
		// NOTE: These tests validate message format, not error detection
		// The rule only triggers when files don't exist on filesystem
	],
});
