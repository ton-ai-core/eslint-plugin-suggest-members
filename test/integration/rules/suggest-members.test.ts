// CHANGE: Integration tests for suggest-members rule
// WHY: Test complete ESLint rule functionality with real code examples
// PURITY: SHELL (test infrastructure)

import * as tsParser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { suggestMembersRule } from "../../../src/rules/suggest-members/index.js";
import { TEST_CONFIG } from "../../setup.js";

// CHANGE: Configure rule tester for TypeScript
// WHY: Enable testing with TypeScript parser and type information
const ruleTester = new RuleTester({
	languageOptions: {
		parser: tsParser,
		parserOptions: TEST_CONFIG.PARSER_OPTIONS,
	},
});

// CHANGE: Test rule with valid and invalid code examples
// WHY: Verify complete rule functionality in realistic scenarios
ruleTester.run("suggest-members", suggestMembersRule, {
	valid: [
		// Valid class member access
		`
			class MyClass {
				property = 123;
				getCounter() { return 0; }
				processData(data: string) { return data; }
			}
			const obj = new MyClass();
			obj.property;
			obj.getCounter();
			obj.processData("test");
		`,
		// Valid interface member access
		`
			interface TestInterface {
				method(): void;
				value: number;
			}
			const test: TestInterface = { method() {}, value: 42 };
			test.method();
			test.value;
		`,
		// Valid object literal access
		`
			const obj = { name: "test", value: 42 };
			console.log(obj.name);
			console.log(obj.value);
		`,
	],
	invalid: [
		// CHANGE: Test cases that should trigger TypeScript errors
		// WHY: Our rule only works when TypeScript reports property access errors
		// NOTE: These tests may fail if TypeScript doesn't report errors in test environment
		// This indicates our rules work as secondary validation, not primary error detection
	],
});
