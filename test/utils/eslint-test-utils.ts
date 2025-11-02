// CHANGE: Common utilities for ESLint integration tests
// WHY: Eliminate code duplication between test files
// PURITY: SHELL (test utilities)

import { ESLint } from "eslint";
import { mkdirSync, rmSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

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
