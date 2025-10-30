// CHANGE: Simplified integration test for suggest-exports rule
// WHY: Test core functionality without code duplication
// PURITY: SHELL (integration testing)

import { describe, expect, it } from "@jest/globals";

describe("suggest-exports integration", () => {
	it("should load plugin without errors", async () => {
		// CHANGE: Test basic plugin loading
		// WHY: Ensure plugin can be imported and configured
		const plugin = await import("../../src/index.js");

		expect(plugin.default).toBeDefined();
		expect(plugin.default.meta).toBeDefined();
		expect(plugin.default.rules).toBeDefined();
		expect(plugin.default.rules["suggest-exports"]).toBeDefined();
	});

	it("should create ESLint instance with plugin", async () => {
		// CHANGE: Test ESLint configuration
		// WHY: Ensure plugin works with ESLint
		// CHANGE: Use utility function to avoid duplication
		// WHY: Eliminate code duplication with eslint-test-utils
		const { createESLintWithSuggestExports } = await import(
			"../utils/eslint-test-utils.js"
		);
		const eslint = await createESLintWithSuggestExports({
			tempDirName: "temp-integration-test",
		});

		expect(eslint).toBeDefined();

		// CHANGE: Test with simple valid code
		// WHY: Ensure no false positives
		const results = await eslint.lintText(
			`
			const x = 1;
			console.log(x);
		`,
			{ filePath: "test.js" },
		);

		expect(results).toHaveLength(1);
		expect(results[0]?.messages || []).toHaveLength(0);
	});

	it("should have correct rule metadata", async () => {
		// CHANGE: Test rule structure using ES modules
		// WHY: Ensure rule is properly configured
		const { suggestExportsRule } = await import(
			"../../src/rules/suggest-exports/index.js"
		);

		expect(suggestExportsRule).toBeDefined();
		expect(suggestExportsRule.meta).toBeDefined();
		expect(suggestExportsRule.meta.type).toBe("problem");
		expect(suggestExportsRule.meta.messages).toBeDefined();
		expect(suggestExportsRule.create).toBeDefined();
		expect(typeof suggestExportsRule.create).toBe("function");
	});
});
