// CHANGE: Package.json reading service
// WHY: Read package.json from filesystem with proper error handling
// PURITY: SHELL (filesystem IO)
// EFFECT: Effect<PackageMetadata, Error, never>

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Effect } from "effect";
import {
	extractPackageMetadata,
	type PackageMetadata,
	type PluginMeta,
} from "../../core/metadata/index.js";

/**
 * JSON value type for safe parsing
 *
 * @pure true - immutable union type
 */
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

/**
 * JSON object type
 *
 * @pure true - immutable record type
 */
interface JsonObject {
	readonly [key: string]: JsonValue;
}

/**
 * JSON array type
 *
 * @pure true - immutable array type
 */
type JsonArray = readonly JsonValue[];

/**
 * Type guard for JSON object validation
 *
 * @param value - Value to check
 * @returns Type predicate for JsonObject
 *
 * @pure true - no side effects
 */
const isJsonObject = (value: JsonValue): value is JsonObject =>
	value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Validate and convert JSON to package structure
 *
 * @param content - Raw JSON string
 * @returns Validated package object
 *
 * @pure false - JSON parsing can throw
 * @complexity O(n) where n = content length
 */
const parsePackageJson = (
	content: string,
): Record<string, string | undefined> => {
	const parsed = JSON.parse(content) as JsonValue;

	if (!isJsonObject(parsed)) {
		throw new Error("Invalid JSON: not an object");
	}

	// CHANGE: Convert to string-only record for type safety
	// WHY: Package.json fields are typically strings
	const result: Record<string, string | undefined> = {};

	for (const [key, value] of Object.entries(parsed)) {
		result[key] = typeof value === "string" ? value : undefined;
	}

	return result;
};

/**
 * Read and parse package.json from filesystem
 *
 * @param packagePath - Path to package.json (defaults to ./package.json)
 * @returns Effect with parsed package metadata
 *
 * @pure false - performs filesystem IO
 * @effect FileSystem
 * @invariant ∀ path: exists(path) → readable(readPackageJson(path))
 * @complexity O(n) where n = file size
 * @throws Never - all errors captured in Effect
 */
export const readPackageJson = (
	packagePath = "./package.json",
): Effect.Effect<PackageMetadata, Error> =>
	Effect.gen(function* () {
		// CHANGE: Read file with absolute path resolution
		// WHY: Ensure consistent path resolution regardless of CWD
		const absolutePath = resolve(packagePath);

		// CHANGE: Read file content as string
		// WHY: Need to parse JSON content
		const content = yield* Effect.tryPromise({
			try: () => readFile(absolutePath, "utf-8"),
			catch: (error) =>
				new Error(
					`Failed to read package.json from ${absolutePath}: ${String(error)}`,
				),
		});

		// CHANGE: Parse JSON content with type safety
		// WHY: Convert string to validated object for metadata extraction
		const packageJson = yield* Effect.try({
			try: () => parsePackageJson(content),
			catch: (error) =>
				new Error(`Failed to parse package.json: ${String(error)}`),
		});

		// CHANGE: Extract and validate metadata
		// WHY: Ensure package.json has required fields
		return yield* extractPackageMetadata(packageJson);
	});

/**
 * Read package.json and create ESLint plugin meta
 *
 * @param packagePath - Path to package.json
 * @returns Effect with ESLint plugin meta object
 *
 * @pure false - performs filesystem IO
 * @effect FileSystem
 * @complexity O(n) where n = file size
 */
export const createPluginMetaFromPackage = (
	packagePath?: string,
): Effect.Effect<PluginMeta, Error> =>
	Effect.gen(function* () {
		const metadata = yield* readPackageJson(packagePath);
		return {
			name: metadata.name,
			version: metadata.version,
		};
	});
