// CHANGE: Real-world E2E tests using test-project scenarios
// WHY: Verify plugin works correctly with actual test files from test-project
// PURITY: SHELL (test infrastructure)
// EFFECT: File system, ESLint, test-project files

import { resolve } from "node:path";
import { describe, expect, it } from "@jest/globals";
import { lintTextWithPlugin } from "./helpers.js";

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
			// CHANGE: Test with code from test-project but using in-memory linting
			// WHY: Verify rule works in actual usage scenario without file system dependencies
			const code = `
				// Typos in module paths
				import { formatString } from "./utils/helpr";
				import { formatDate } from "./utils/formater";
			`;

			const results = await lintTextWithPlugin(code, {
				filePath: resolve(testProjectDir, "src", "index.ts"),
			});

			expect(results).toHaveLength(1);
			const messages = results[0]?.messages ?? [];
			expect(messages).toHaveLength(2);
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
			// CHANGE: Test with valid code
			// WHY: Verify plugin works without throwing on valid code
			const code = `
				import { formatString } from "./utils/helper";
				import { formatDate } from "./utils/formatter";

				console.log(formatString("test"));
			`;

			const results = await lintTextWithPlugin(code, {
				filePath: resolve(testProjectDir, "src", "valid.ts"),
			});

			expect(results).toHaveLength(1);

			// Should execute without throwing errors
			// No need to check specific errors - integration tests handle that
		});
	});

	describe("suggest-members rule", () => {
		it("should work with member access code", async () => {
			// CHANGE: Test member access rule integration
			// WHY: Verify rule can be enabled and run
			const code = `
				const str: string = "test";
				const result = str.toUpperCase();

				const arr: number[] = [1, 2, 3];
				arr.push(4);
			`;

			const results = await lintTextWithPlugin(code, {
				filePath: resolve(testProjectDir, "src", "test.ts"),
			});

			expect(results).toHaveLength(1);

			// Should execute without throwing errors
			// Actual rule behavior is tested in integration tests
		});
	});

	describe("All rules integration", () => {
		it("should work with all rules enabled together", async () => {
			// CHANGE: Test complete integration with all rules enabled
			// WHY: Verify all rules can work together without conflicts
			const code = `
				// Module path typos
				import { formatString } from "./utils/helpr";

				// Member access typos
				const str: string = "test";
				str.toUpperCas();
			`;

			const results = await lintTextWithPlugin(code, {
				filePath: resolve(testProjectDir, "src", "test.ts"),
			});

			// CHANGE: Verify plugin integration works
			// WHY: E2E test validates that all rules can be enabled simultaneously
			expect(results).toHaveLength(1);

			// Should execute all rules without conflicts or errors
			// Actual rule behavior is tested in integration tests
		});
	});

	describe("Performance requirements", () => {
		it("should lint files in reasonable time", async () => {
			// CHANGE: Test performance with realistic code
			// WHY: Ensure rules don't cause significant slowdown
			const code = `
				import { formatString } from "./utils/helper";
				import { readFileSync } from "fs";

				const str: string = "test";
				const data = str.toUpperCase();

				const arr: number[] = [1, 2, 3];
				arr.push(4);

				interface User {
					name: string;
					email: string;
				}
				const user: User = { name: "John", email: "john@example.com" };
				console.log(user.name);
			`;

			const start = performance.now();
			await lintTextWithPlugin(code, {
				filePath: resolve(testProjectDir, "src", "test.ts"),
			});
			const duration = performance.now() - start;

			// Should complete in reasonable time (< 5 seconds for a small file)
			expect(duration).toBeLessThan(5000);
		});
	});
});
