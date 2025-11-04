// CHANGE: Integration test verifying export suggestions include type signatures
// WHY: Guard against regressions where suggest-exports omits TypeScript signatures
// PURITY: SHELL (ESLint integration)

import { describe, expect, it } from "@jest/globals";
import {
	createTestProjectFileManager,
	lintWithTypeAwareRules,
} from "../../utils/eslint-test-utils.js";

describe("suggest-exports rule signatures", () => {
	it("includes type signature information in suggestions", async () => {
		const fileManager = createTestProjectFileManager("temp-export-signature");
		fileManager.setup();

		try {
			fileManager.createFile(
				"helper.ts",
				`
				export function formatString(value: string): string {
					return value.trim();
				}
			`.trimStart(),
			);

			const entryPath = fileManager.createFile(
				"entry.ts",
				`
			export { forma1tString } from "./helper";
		`.trimStart(),
			);

			await lintWithTypeAwareRules({
				rules: {
					"@ton-ai-core/suggest-members/suggest-exports": "error",
				},
				filePath: entryPath,
				assertMessage: (message) => {
					expect(message.ruleId).toBe(
						"@ton-ai-core/suggest-members/suggest-exports",
					);
					expect(message.message).toMatch(
						/formatString:\s*\(value: string\) => string/,
					);
				},
			});
		} finally {
			fileManager.cleanup();
		}
	});
});
