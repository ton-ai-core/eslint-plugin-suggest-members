// CHANGE: Integration test verifying suggest-members diagnostics include type signatures
// WHY: Prevent regressions where member suggestions omit TypeScript signatures
// PURITY: SHELL (ESLint integration with filesystem effects)

import type { Linter } from "eslint";
import { describe, expect, it } from "vitest";
import {
	createTestProjectFileManager,
	lintWithTypeAwareRules,
} from "../../utils/eslint-test-utils.js";

interface SignatureTestFile {
	readonly name: string;
	readonly content: string;
}

interface SignatureScenarioConfig {
	readonly tempDir: string;
	readonly entry: SignatureTestFile;
	readonly additionalFiles?: readonly SignatureTestFile[];
	readonly assertion: (message: Linter.LintMessage) => void;
}

const expectSignatureMatch =
	(pattern: RegExp) =>
	(message: Linter.LintMessage): void => {
		expect(message.ruleId).toBe("@ton-ai-core/suggest-members/suggest-members");
		expect(message.message).toMatch(pattern);
	};

const runSignatureScenario = async ({
	tempDir,
	entry,
	additionalFiles = [],
	assertion,
}: SignatureScenarioConfig): Promise<void> => {
	const fileManager = createTestProjectFileManager(tempDir);
	fileManager.setup();

	try {
		additionalFiles.forEach((file) => {
			fileManager.createFile(file.name, file.content.trimStart());
		});

		const entryPath = fileManager.createFile(
			entry.name,
			entry.content.trimStart(),
		);

		await lintWithTypeAwareRules({
			rules: {
				"@ton-ai-core/suggest-members/suggest-members": "error",
			},
			filePath: entryPath,
			assertMessage: assertion,
		});
	} finally {
		fileManager.cleanup();
	}
};

describe("suggest-members rule signatures", () => {
	it("includes method signatures in suggestions", async () => {
		await runSignatureScenario({
			tempDir: "temp-member-signature",
			entry: {
				name: "entry.ts",
				content: `
					const calculator = {
						add(a: number, b: number): number {
							return a + b;
						},
						multiply(a: number, b: number): number {
							return a * b;
						}
					} as const;

					calculator.ad(1, 2);
				`,
			},
			assertion: expectSignatureMatch(
				/add:\s*\(a: number, b: number\) => number/,
			),
		});
	});

	it("includes signatures for built-in string methods", async () => {
		await runSignatureScenario({
			tempDir: "temp-member-signature-string",
			entry: {
				name: "entry.ts",
				content: `
					const value = "sample";
					value.toUpperCas();
				`,
			},
			assertion: expectSignatureMatch(/toUpperCase:\s*\(\) => string/),
		});
	});
});
