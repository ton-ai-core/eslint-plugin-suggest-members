// CHANGE: Unit tests for package metadata extraction
// WHY: Ensure reliable metadata extraction from package.json
// PURITY: SHELL (test infrastructure)

// Jest globals are available without import
import { Effect } from "effect";
import {
	createPluginMeta,
	extractPackageMetadata,
} from "../../../../src/core/metadata/package-info.js";

// Helper templates and functions inline to avoid compilation issues
const PACKAGE_TEMPLATES = {
	valid: {
		name: "test-package",
		version: "1.0.0",
		description: "Test package",
		author: "Test Author",
		license: "MIT",
	},
	minimal: {
		name: "test-package",
		version: "1.0.0",
	},
	withUndefined: {
		name: "test-package",
		version: "1.0.0",
		description: undefined,
		author: undefined,
		license: undefined,
	},
	missingName: {
		version: "1.0.0",
	} as Record<string, string | undefined>,
	missingVersion: {
		name: "test-package",
	} as Record<string, string | undefined>,
	emptyName: {
		name: "",
		version: "1.0.0",
	},
	emptyVersion: {
		name: "test-package",
		version: "",
	},
};

const expectPackageExtractionError = async (
	packageJson: Record<string, string | undefined>,
	expectedError: string,
): Promise<void> => {
	await expect(
		Effect.runPromise(extractPackageMetadata(packageJson)),
	).rejects.toThrow(expectedError);
};

const expectPackageExtractionSuccess = async (
	packageJson: Record<string, string | undefined>,
	expected: Record<string, string | undefined>,
): Promise<void> => {
	const result = await Effect.runPromise(extractPackageMetadata(packageJson));
	expect(result).toEqual(expected);
};

describe("package metadata extraction", () => {
	describe("extractPackageMetadata", () => {
		it("should extract valid metadata from complete package.json", async () => {
			// CHANGE: Test successful metadata extraction
			// WHY: Verify core functionality with valid input
			await expectPackageExtractionSuccess(
				PACKAGE_TEMPLATES.valid,
				PACKAGE_TEMPLATES.valid,
			);
		});

		it("should extract metadata with minimal required fields", async () => {
			// CHANGE: Test extraction with only required fields
			// WHY: Verify function works with minimal valid input
			await expectPackageExtractionSuccess(PACKAGE_TEMPLATES.minimal, {
				name: "test-package",
				version: "1.0.0",
				description: undefined,
				author: undefined,
				license: undefined,
			});
		});

		it("should reject package.json without name", async () => {
			// CHANGE: Test validation of required name field
			// WHY: Ensure function fails fast with invalid input
			await expectPackageExtractionError(
				PACKAGE_TEMPLATES.missingName,
				"missing or empty name field",
			);
		});

		it("should reject package.json without version", async () => {
			// CHANGE: Test validation of required version field
			// WHY: Ensure function fails fast with invalid input
			await expectPackageExtractionError(
				PACKAGE_TEMPLATES.missingVersion,
				"missing or empty version field",
			);
		});

		it("should reject package.json with empty name", async () => {
			// CHANGE: Test validation of non-empty name requirement
			// WHY: Ensure function validates field content, not just presence
			await expectPackageExtractionError(
				PACKAGE_TEMPLATES.emptyName,
				"missing or empty name field",
			);
		});

		it("should reject package.json with empty version", async () => {
			// CHANGE: Test validation of non-empty version requirement
			// WHY: Ensure function validates field content, not just presence
			await expectPackageExtractionError(
				PACKAGE_TEMPLATES.emptyVersion,
				"missing or empty version field",
			);
		});
	});

	describe("createPluginMeta", () => {
		it("should create ESLint plugin meta from package metadata", () => {
			// CHANGE: Test plugin meta creation
			// WHY: Verify transformation from package metadata to ESLint format
			const metadata = {
				name: "@ton-ai-core/eslint-plugin-suggest-members",
				version: "1.6.4",
				description: "Test description",
				author: "Test Author",
				license: "MIT",
			};

			const result = createPluginMeta(metadata);

			expect(result).toEqual({
				name: "@ton-ai-core/eslint-plugin-suggest-members",
				version: "1.6.4",
			});
		});

		it("should only include name and version in plugin meta", () => {
			// CHANGE: Test that only required fields are included
			// WHY: Verify ESLint plugin meta contains only necessary information
			const metadata = {
				name: "test-package",
				version: "1.0.0",
				description: "Should not be included",
				author: "Should not be included",
				license: "Should not be included",
			};

			const result = createPluginMeta(metadata);

			expect(Object.keys(result)).toEqual(["name", "version"]);
			expect(result).not.toHaveProperty("description");
			expect(result).not.toHaveProperty("author");
			expect(result).not.toHaveProperty("license");
		});
	});

	describe("mathematical properties", () => {
		it("should satisfy extraction invariant", async () => {
			// CHANGE: Test mathematical invariant
			// WHY: Verify ∀ pkg: valid(pkg) → extractable(pkg.name, pkg.version)
			const packageJson = {
				name: "test-package",
				version: "2.1.0",
			};

			const result = await Effect.runPromise(
				extractPackageMetadata(packageJson),
			);

			// INVARIANT: result.name === packageJson.name ∧ result.version === packageJson.version
			expect(result.name).toBe(packageJson.name);
			expect(result.version).toBe(packageJson.version);
		});

		it("should satisfy plugin meta invariant", () => {
			// CHANGE: Test plugin meta invariant
			// WHY: Verify ∀ meta: createPluginMeta(meta).name === meta.name
			const metadata = {
				name: "invariant-test",
				version: "3.2.1",
				description: undefined,
				author: undefined,
				license: undefined,
			};

			const result = createPluginMeta(metadata);

			// INVARIANT: createPluginMeta(meta).name === meta.name
			expect(result.name).toBe(metadata.name);
			expect(result.version).toBe(metadata.version);
		});
	});
});
