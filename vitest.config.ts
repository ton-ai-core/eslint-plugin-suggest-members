// CHANGE: Migrate test runner from Jest to Vitest with deterministic equivalence
// WHY: Faster execution, native ESM, and coverage via V8 without transpilation
// QUOTE(ТЗ): "Проект использует Effect + функциональную парадигму"
// REF: User request to replace jest.config.mjs with Vitest configuration
// PURITY: SHELL (test configuration only)
// INVARIANT: ∀ test ∈ suite: behavior_jest(test) ≡ behavior_vitest(test)
// EFFECT: Effect<Readonly<TestReport>, never, TestEnvironment>
// COMPLEXITY: O(n) where n = |test files|

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		globals: false,
		environment: "node",
		include: ["test/**/*.{test,spec}.ts"],
		exclude: ["node_modules", "dist", "dist-test"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.ts"],
			exclude: [
				"src/**/*.test.ts",
				"src/**/*.spec.ts",
				"src/**/__tests__/**",
				"src/core/metadata/generated.ts",
				"scripts/**/*.ts",
			],
			thresholds: {
				"src/core/**/*.ts": {
					branches: 100,
					functions: 100,
					lines: 100,
					statements: 100,
				},
				global: {
					branches: 10,
					functions: 10,
					lines: 10,
					statements: 10,
				},
			},
		},
		clearMocks: true,
		mockReset: true,
		restoreMocks: true,
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
});
