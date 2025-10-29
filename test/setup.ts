// CHANGE: Test environment setup
// WHY: Configure Jest and testing utilities for ESLint plugin testing
// PURITY: SHELL (test infrastructure)

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Test configuration constants
 *
 * @pure true - immutable configuration
 */
export const TEST_CONFIG = {
	// Test fixture paths
	FIXTURES_DIR: resolve(__dirname, "fixtures"),
	EXAMPLES_DIR: resolve(__dirname, "../example/src"),

	// TypeScript configuration for tests
	TSCONFIG_PATH: resolve(__dirname, "../tsconfig.test.json"),

	// ESLint parser configuration
	PARSER_OPTIONS: {
		ecmaVersion: 2020 as const,
		sourceType: "module" as const,
		projectService: {
			allowDefaultProject: ["*.ts", "*.tsx"] as string[],
		},
		tsconfigRootDir: resolve(__dirname, ".."),
	},
} as const;

/**
 * Common test utilities
 *
 * @pure false - test infrastructure
 */
export const createTestContext = () => ({
	parserOptions: TEST_CONFIG.PARSER_OPTIONS,
	filename: resolve(TEST_CONFIG.FIXTURES_DIR, "test.ts"),
});
