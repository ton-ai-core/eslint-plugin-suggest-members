// CHANGE: Integration test verifying suggest-members diagnostics include type signatures
// WHY: Prevent regressions where member suggestions omit TypeScript signatures
// PURITY: SHELL (ESLint integration with filesystem effects)

import { describe, expect, it } from "@jest/globals";
import {
	lintWithTypeAwareRules,
	TestFileManager,
} from "../../utils/eslint-test-utils.js";

describe("suggest-members rule signatures", () => {
	it("includes method signatures in suggestions", async () => {
		const fileManager = new TestFileManager("test/temp-member-signature");
		fileManager.setup();

		try {
			const entryPath = fileManager.createFile(
				"entry.ts",
				`
				const calculator = {
					add(a: number, b: number): number {
						return a + b;
					},
					multiply(a: number, b: number): number {
						return a * b;
					}
				} as const;

				calculator.ad(1, 2);
			`.trimStart(),
			);

			await lintWithTypeAwareRules({
				rules: {
					"@ton-ai-core/suggest-members/suggest-members": "error",
				},
				filePath: entryPath,
				assertMessage: (message) => {
					expect(message.ruleId).toBe(
						"@ton-ai-core/suggest-members/suggest-members",
					);
					expect(message.message).toMatch(
						/add:\s*\(a: number, b: number\) => number/,
					);
				},
			});
		} finally {
			fileManager.cleanup();
		}
	});

	it("includes signatures for built-in string methods", async () => {
		const fileManager = new TestFileManager("test/temp-member-signature-string");
		fileManager.setup();

		try {
			const entryPath = fileManager.createFile(
				"entry.ts",
				`
				const value = "sample";
				value.toUpperCas();
			`.trimStart(),
			);

			await lintWithTypeAwareRules({
				rules: {
					"@ton-ai-core/suggest-members/suggest-members": "error",
				},
				filePath: entryPath,
				assertMessage: (message) => {
					expect(message.ruleId).toBe(
						"@ton-ai-core/suggest-members/suggest-members",
					);
					expect(message.message).toMatch(
						/toUpperCase:\s*\(\) => string/,
					);
				},
			});
		} finally {
			fileManager.cleanup();
		}
	});
});
