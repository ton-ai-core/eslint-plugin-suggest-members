// CHANGE: Common utilities for ESLint integration tests
// WHY: Eliminate code duplication between test files
// PURITY: SHELL (test utilities)

import { expect } from "@jest/globals";
import type { Linter } from "eslint";
import { ESLint } from "eslint";
import { mkdirSync, rmSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { TEST_CONFIG } from "../setup.js";

/**
 * Configuration for ESLint test setup
 */
export interface ESLintTestConfig {
	readonly tempDirName: string;
	readonly useTypeScript?: boolean;
	readonly cwd?: string;
}

/**
 * Test file manager for temporary files
 */
export class TestFileManager {
	private tempFiles: string[] = [];
	private readonly tempDir: string;

	constructor(tempDirName: string, cwd: string = process.cwd()) {
		this.tempDir = join(cwd, tempDirName);
	}

	/**
	 * Setup temporary directory
	 */
	setup(): void {
		try {
			mkdirSync(this.tempDir, { recursive: true });
		} catch {
			// Directory might already exist
		}
	}

	/**
	 * Create temporary file with content
	 */
	createFile(filename: string, content: string): string {
		const filePath = join(this.tempDir, filename);
		writeFileSync(filePath, content, "utf8");
		this.tempFiles.push(filePath);
		return filePath;
	}

	/**
	 * Create temporary file in cwd (not in temp directory)
	 */
	createFileInCwd(filename: string, content: string): string {
		const filePath = join(process.cwd(), filename);
		writeFileSync(filePath, content, "utf8");
		this.tempFiles.push(filePath);
		return filePath;
	}

	/**
	 * Cleanup all temporary files and directories
	 */
	cleanup(): void {
		this.tempFiles.forEach((file) => {
			try {
				unlinkSync(file);
			} catch {
				// File might not exist
			}
		});
		try {
			rmSync(this.tempDir, { recursive: true, force: true });
		} catch {
			// Directory might not exist
		}
		this.tempFiles = [];
	}
}

export interface TypeAwareESLintOptions {
	readonly rules: Linter.RulesRecord;
	readonly cwd?: string;
}

/**
 * Create ESLint instance configured with TypeScript project awareness and provided rules
 */
export async function createTypeAwareESLint(
	options: TypeAwareESLintOptions,
): Promise<ESLint> {
	const pluginModule = await import("../../src/index.js");
	const plugin = pluginModule.default as any;

	const tsParserModule = await import("@typescript-eslint/parser");
	const parser = (tsParserModule as any).default ?? tsParserModule;

	return new ESLint({
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
				rules: options.rules,
			},
		],
		cwd: options.cwd ?? TEST_CONFIG.PARSER_OPTIONS.tsconfigRootDir,
	});
}

/**
 * Lint single file with provided ESLint instance and return collected messages
 */
export async function lintFileWithESLint(
	eslint: ESLint,
	filePath: string,
): Promise<readonly Linter.LintMessage[]> {
	const results = await eslint.lintFiles([filePath]);
	return (results[0]?.messages ?? []) as readonly Linter.LintMessage[];
}

/**
 * Expect exactly one lint message and apply assertion callback
 */
export function expectSingleLintMessage(
	messages: readonly Linter.LintMessage[],
	assertMessage: (message: Linter.LintMessage) => void,
): void {
	expect(messages).toHaveLength(1);
	assertMessage(messages[0] as Linter.LintMessage);
}

export interface LintWithRulesOptions {
	readonly rules: Linter.RulesRecord;
	readonly filePath: string;
	readonly assertMessage: (message: Linter.LintMessage) => void;
}

/**
 * Convenience helper: create ESLint with rules, lint file, and assert single message
 */
export async function lintWithTypeAwareRules(
	options: LintWithRulesOptions,
): Promise<void> {
	const eslint = await createTypeAwareESLint({ rules: options.rules });
	const messages = await lintFileWithESLint(eslint, options.filePath);
	expectSingleLintMessage(messages, options.assertMessage);
}

/**
 * Create ESLint instance with suggest-exports rule
 */
export async function createESLintWithSuggestExports(
	config: ESLintTestConfig,
): Promise<ESLint> {
	const baseConfig = {
		files: ["**/*.js", "**/*.ts", "**/*.tsx"],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: "module" as const,
		},
		plugins: {
			"@ton-ai-core/suggest-members": (await import("../../src/index.js"))
				.default as any,
		},
		rules: {
			"@ton-ai-core/suggest-members/suggest-exports": "error",
		},
	};

	if (config.useTypeScript === true) {
		const tsParser = await import("@typescript-eslint/parser");
		(baseConfig.languageOptions as any).parser = tsParser;
		(baseConfig.languageOptions as any).parserOptions = {
			ecmaVersion: 2020,
			sourceType: "module",
			projectService: true,
		};
	}

	return new ESLint({
		overrideConfigFile: true,
		overrideConfig: [baseConfig as any],
		cwd: config.cwd ?? process.cwd(),
	});
}

/**
 * Common test result analysis
 */
export interface TestResultAnalysis {
	readonly allMessages: any[];
	readonly suggestExportsErrors: any[];
	readonly errorMessages: string[];
}

/**
 * Analyze ESLint results for suggest-exports errors
 */
export function analyzeResults(results: any[]): TestResultAnalysis {
	const allMessages = (results[0]?.messages ?? []) as any[];
	const suggestExportsErrors = allMessages.filter(
		(msg: any) => msg.ruleId === "@ton-ai-core/suggest-members/suggest-exports",
	);
	const errorMessages = suggestExportsErrors.map((err: any) => err.message);

	return {
		allMessages,
		suggestExportsErrors,
		errorMessages,
	};
}

/**
 * Log test results for debugging
 */
export function logTestResults(
	testName: string,
	analysis: TestResultAnalysis,
): void {
	console.log(
		`${testName} - All messages:`,
		analysis.allMessages.map((m) => ({
			ruleId: m.ruleId,
			message: m.message,
			line: m.line,
			column: m.column,
		})),
	);
	console.log("Suggest exports errors:", analysis.suggestExportsErrors);
}
