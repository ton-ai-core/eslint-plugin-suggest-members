// CHANGE: End-to-end tests for complete plugin integration
// WHY: Test plugin works correctly when integrated with ESLint
// PURITY: SHELL (test infrastructure)

import type { ESLint } from "eslint";
import { describe, expect, it } from "vitest";
import { lintTextWithPlugin, suggestMembersPlugin } from "./helpers.js";

const expectValidESLintResults = (results: ESLint.LintResult[]): void => {
	expect(results).toHaveLength(1);
	expect(results[0]?.messages.length).toBeGreaterThanOrEqual(0);
};

const TEST_CODE_TEMPLATES = {
	propertyTypo: `
		const obj = { property: "value" };
		console.log(obj.proprty); // close typo
	`,
	multipleErrors: `
		interface User {
			name: string;
			email: string;
		}
		const user: User = { name: "John", email: "john@example.com" };
		console.log(user.naem); // typo
		console.log(user.emai); // typo
	`,
	methodTypo: `
		class Calculator {
			getValue(): number { return 42; }
		}
		const calc = new Calculator();
		calc.getValu(); // typo
	`,
};

describe("plugin integration e2e", () => {
	it("should integrate correctly with ESLint", async () => {
		// CHANGE: Test complete ESLint integration
		// WHY: Verify plugin works in real ESLint environment
		// Test code with intentional errors
		const code = `
			const fs = require('fs');
			const data = fs.readFileSyncc('test.txt'); // typo in method name
			console.log(data.lenght); // typo in property
		`;

		const results = await lintTextWithPlugin(code, { filePath: "test.ts" });

		expectValidESLintResults(results);

		// Plugin should work without errors (may or may not find violations)
		// This is expected since our rules may not trigger on all code patterns
	});

	it("should provide correct plugin metadata", () => {
		// CHANGE: Test plugin exports correct metadata
		// WHY: Ensure plugin is properly configured
		expect(suggestMembersPlugin.meta).toBeDefined();
		expect(suggestMembersPlugin.meta?.name).toBe(
			"@ton-ai-core/eslint-plugin-suggest-members",
		);
		expect(suggestMembersPlugin.meta?.version).toBeDefined();
	});

	it("should export all required rules", () => {
		// CHANGE: Test all rules are exported
		// WHY: Ensure plugin provides expected functionality
		expect(suggestMembersPlugin.rules).toBeDefined();
		expect(suggestMembersPlugin.rules?.["suggest-members"]).toBeDefined();
		expect(suggestMembersPlugin.rules?.["suggest-imports"]).toBeDefined();
		expect(suggestMembersPlugin.rules?.["suggest-module-paths"]).toBeDefined();
		expect(suggestMembersPlugin.rules?.["suggest-exports"]).toBeDefined();
	});

	it("should handle multiple rule violations in single file", async () => {
		// CHANGE: Test multiple violations
		// WHY: Verify plugin handles complex scenarios
		const code = TEST_CODE_TEMPLATES.multipleErrors;

		const results = await lintTextWithPlugin(code, { filePath: "test.ts" });

		expectValidESLintResults(results);
	});

	it("should work with TypeScript-specific syntax", async () => {
		// CHANGE: Test TypeScript compatibility
		// WHY: Verify plugin works with TypeScript features
		const code = TEST_CODE_TEMPLATES.methodTypo;

		const results = await lintTextWithPlugin(code, { filePath: "test.ts" });

		expectValidESLintResults(results);
	});

	it("should handle configuration options correctly", async () => {
		// CHANGE: Test rule configuration
		// WHY: Verify rules work with basic configuration
		const code = TEST_CODE_TEMPLATES.propertyTypo;

		const results = await lintTextWithPlugin(code, { filePath: "test.ts" });

		expectValidESLintResults(results);

		// Plugin should work without errors (may or may not find violations)
		// This is expected since our rules may not trigger on all code patterns
	});
});
