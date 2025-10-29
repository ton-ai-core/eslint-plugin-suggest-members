// CHANGE: Package metadata extraction utilities
// WHY: Avoid hardcoding plugin metadata, extract from package.json
// PURITY: CORE (pure data transformation)
// INVARIANT: ∀ pkg: valid(pkg) → extractable(pkg.name, pkg.version)

import { Effect } from "effect";

/**
 * Package metadata structure
 *
 * @pure true - immutable data structure
 * @invariant name.length > 0 ∧ version matches semver pattern
 */
export interface PackageMetadata {
	readonly name: string;
	readonly version: string;
	readonly description?: string | undefined;
	readonly author?: string | undefined;
	readonly license?: string | undefined;
}

/**
 * Plugin meta structure for ESLint
 *
 * @pure true - immutable data structure
 */
export interface PluginMeta {
	readonly name: string;
	readonly version: string;
}

/**
 * Extract essential metadata from package.json content
 *
 * @param packageJson - Raw package.json object (validated externally)
 * @returns Validated package metadata
 *
 * @pure true - no side effects, deterministic transformation
 * @invariant ∀ input: valid_json(input) → valid_metadata(extract(input))
 * @complexity O(1) - constant time property access
 * @precondition packageJson.name ∧ packageJson.version exist
 * @postcondition result.name === packageJson.name ∧ result.version === packageJson.version
 */
export const extractPackageMetadata = (
	packageJson: Record<string, string | undefined>,
): Effect.Effect<PackageMetadata, Error> =>
	Effect.try({
		try: () => {
			// CHANGE: Explicit null/undefined checks for strict boolean expressions
			// WHY: Satisfy ESLint strict-boolean-expressions rule
			const name = packageJson["name"];
			const version = packageJson["version"];

			if (name === undefined || name === null || name.length === 0) {
				throw new Error("Invalid package.json: missing or empty name field");
			}

			if (version === undefined || version === null || version.length === 0) {
				throw new Error("Invalid package.json: missing or empty version field");
			}

			// CHANGE: Extract metadata with optional fields
			// WHY: Support partial package.json structures
			const description = packageJson["description"];
			const author = packageJson["author"];
			const license = packageJson["license"];

			const metadata: PackageMetadata = {
				name,
				version,
				description,
				author,
				license,
			};

			return metadata;
		},
		catch: (error) =>
			new Error(`Failed to extract package metadata: ${String(error)}`),
	});

/**
 * Create ESLint plugin meta object from package metadata
 *
 * @param metadata - Validated package metadata
 * @returns ESLint plugin meta structure
 *
 * @pure true - deterministic transformation
 * @invariant ∀ meta: createPluginMeta(meta).name === meta.name
 * @complexity O(1) - simple object construction
 */
export const createPluginMeta = (metadata: PackageMetadata): PluginMeta => ({
	name: metadata.name,
	version: metadata.version,
});
