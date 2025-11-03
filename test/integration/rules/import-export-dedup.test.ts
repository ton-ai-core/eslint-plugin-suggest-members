// CHANGE: Integration test ensuring import/export rules don't duplicate diagnostics
// WHY: Regression coverage for skipWhenTypeScriptAvailable semantics
// PURITY: SHELL (ESLint integration)

import { describe, expect, it } from "@jest/globals";
import { ESLint } from "eslint";

import { TEST_CONFIG } from "../../setup.js";
import { TestFileManager } from "../../utils/eslint-test-utils.js";

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

			const pluginModule = await import("../../../dist/index.js");
			const plugin = pluginModule.default as any;
			const tsParserModule = await import("@typescript-eslint/parser");
			const parser = (tsParserModule as any).default ?? tsParserModule;

			const eslint = new ESLint({
				overrideConfigFile: true,
				overrideConfig: [
					{
						files: ["**/*.ts"],
						languageOptions: {
							parser,
							parserOptions: {
								...TEST_CONFIG.PARSER_OPTIONS,
								project: TEST_CONFIG.TSCONFIG_PATH,
								tsconfigRootDir: TEST_CONFIG.PARSER_OPTIONS.tsconfigRootDir,
							},
						},
						plugins: {
							"@ton-ai-core/suggest-members": plugin,
						},
						rules: {
							"@ton-ai-core/suggest-members/suggest-imports": "error",
							"@ton-ai-core/suggest-members/suggest-exports": "error",
						},
					},
				],
				cwd: TEST_CONFIG.PARSER_OPTIONS.tsconfigRootDir,
			});

			const results = await eslint.lintFiles([entryPath]);
			const messages = results[0]?.messages ?? [];

			expect(messages).toHaveLength(1);
			expect(messages[0]?.ruleId).toBe(
				"@ton-ai-core/suggest-members/suggest-imports",
			);
		} finally {
			fileManager.cleanup();
		}
	});
});
