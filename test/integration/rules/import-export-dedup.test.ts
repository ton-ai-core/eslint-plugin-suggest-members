// CHANGE: Integration test ensuring import/export rules don't duplicate diagnostics
// WHY: Regression coverage for skipWhenTypeScriptAvailable semantics
// PURITY: SHELL (ESLint integration)

import { describe, expect, it } from "@jest/globals";
import {
	lintWithTypeAwareRules,
	TestFileManager,
} from "../../utils/eslint-test-utils.js";

describe("suggest-imports and suggest-exports deduplication", () => {
	it("reports a single diagnostic when TypeScript services are available", async () => {
		const fileManager = new TestFileManager("test/temp-dedup");
		fileManager.setup();

		try {
			fileManager.createFile(
				"helper.ts",
				`
				export const formatString = (value: string): string => value;
				export const calculate = (a: number, b: number): number => a + b;
			`.trimStart(),
			);

			const entryContent = `
				import { formatStrin } from "./helper";
				console.log(formatStrin);
			`.trimStart();

			const entryPath = fileManager.createFile("entry.ts", entryContent);

			await lintWithTypeAwareRules({
				rules: {
					"@ton-ai-core/suggest-members/suggest-imports": "error",
					"@ton-ai-core/suggest-members/suggest-exports": "error",
				},
				filePath: entryPath,
				assertMessage: (message) => {
					expect(message.ruleId).toBe(
						"@ton-ai-core/suggest-members/suggest-imports",
					);
				},
			});
		} finally {
			fileManager.cleanup();
		}
	});
});
