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
		// CHANGE: Test cases for member access typos
		// WHY: Verify rule suggests corrections when accessing non-existent members
		// NOTE: Rule works when TypeScript reports property access errors

		// Test string method typos
		{
			code: `
				const str: string = "test";
				str.toUpperCas();
			`,
			errors: [
				{
					messageId: "suggestMembers",
					// Should suggest 'toUpperCase'
				},
			],
		},
		{
			code: `
				const str: string = "hello";
				str.toLowerCas();
			`,
			errors: [
				{
					messageId: "suggestMembers",
					// Should suggest 'toLowerCase'
				},
			],
		},

		// Test array method typos
		{
			code: `
				const arr: number[] = [1, 2, 3];
				arr.pusj(4);
			`,
			errors: [
				{
					messageId: "suggestMembers",
					// Should suggest 'push'
				},
			],
		},
		{
			code: `
				const arr: number[] = [1, 2, 3];
				arr.slise(0, 2);
			`,
			errors: [
				{
					messageId: "suggestMembers",
					// Should suggest 'slice'
				},
			],
		},

		// Test object property typos
		{
			code: `
				interface User {
					name: string;
					age: number;
					email: string;
				}
				const user: User = { name: "John", age: 30, email: "john@example.com" };
				console.log(user.nam);
			`,
			errors: [
				{
					messageId: "suggestMembers",
					// Should suggest 'name'
				},
			],
		},
		{
			code: `
				interface User {
					name: string;
					email: string;
				}
				const user: User = { name: "John", email: "john@example.com" };
				console.log(user.emal);
			`,
			errors: [
				{
					messageId: "suggestMembers",
					// Should suggest 'email'
				},
			],
		},
	],
});
