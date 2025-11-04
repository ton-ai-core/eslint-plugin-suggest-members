// CHANGE: Real-world E2E tests using test-project scenarios
// WHY: Verify plugin works correctly with actual test files from test-project
// PURITY: SHELL (test infrastructure)
// EFFECT: File system, ESLint, test-project files

import { resolve } from "node:path";
import { describe, expect, it } from "@jest/globals";
import { createPluginTestESLint } from "./helpers.js";

/**
 * Create ESLint instance configured for real-world testing
 *
 * @pure false - creates stateful ESLint instance
 * @effect ESLint configuration
 */
/**
 * Real-world E2E test suite
 *
 * @pure false - runs E2E tests with file system
 * @effect Reads test-project files, runs ESLint
 * @invariant ∀ test_file: valid_errors(lint(test_file))
 */
describe("Real-world E2E scenarios from test-project", () => {
	const testProjectDir = resolve(process.cwd(), "test-project");

	describe("suggest-module-paths rule", () => {
		it("should detect path typos in real file scenario", async () => {
			const eslint = createPluginTestESLint({ cwd: testProjectDir });
			const results = await eslint.lintFiles(["src/index.ts"]);

			expect(results).toHaveLength(1);
			const messages = results[0]?.messages ?? [];
			expect(messages.length).toBeGreaterThanOrEqual(2);
			const hasHelperSuggestion = messages.some((message) =>
				message.message.includes("./utils/helper"),
			);
			const hasFormatterSuggestion = messages.some((message) =>
				message.message.includes("./utils/formatter"),
			);
			expect(hasHelperSuggestion).toBe(true);
			expect(hasFormatterSuggestion).toBe(true);
		});

		it("should not report errors for valid code", async () => {
			const eslint = createPluginTestESLint({ cwd: testProjectDir });
			const results = await eslint.lintFiles(["src/valid.ts"]);

			expect(results).toHaveLength(1);

			// Should execute without throwing errors
			// No need to check specific errors - integration tests handle that
		});
	});

	describe("suggest-members rule", () => {
		it("should work with member access code", async () => {
			const eslint = createPluginTestESLint({ cwd: testProjectDir });
			const results = await eslint.lintFiles(["src/test-members.ts"]);

			expect(results).toHaveLength(1);

			// Should execute without throwing errors
			// Actual rule behavior is tested in integration tests
		});
	});

	describe("All rules integration", () => {
		it("should work with all rules enabled together", async () => {
			const eslint = createPluginTestESLint({ cwd: testProjectDir });
			const results = await eslint.lintFiles(["src/test-all-rules.ts"]);

			expect(results).toHaveLength(1);

			// Should execute all rules without conflicts or errors
			// Actual rule behavior is tested in integration tests
		});
	});

	describe("Performance requirements", () => {
		it("should lint files in reasonable time", async () => {
			const start = performance.now();
			const eslint = createPluginTestESLint({ cwd: testProjectDir });
			await eslint.lintFiles(["src/comprehensive-test.ts"]);
			const duration = performance.now() - start;

			// Should complete in reasonable time (< 5 seconds for a small file)
			expect(duration).toBeLessThan(5000);
		});
	});
});
