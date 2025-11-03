// CHANGE: Module path lookup domain logic
// WHY: Business logic for validating module paths
// PURITY: SHELL (CORE + SHELL composition)
// REF: FUNCTIONAL_ARCHITECTURE.md - SHELL layer

import { dirname, join, resolve } from "node:path";
import type { TSESTree } from "@typescript-eslint/utils";
import { Effect } from "effect";
import type {
	ModulePathValidationResult,
	SuggestionWithScore,
} from "../../core/index.js";
import { findSimilarCandidates, isValidCandidate } from "../../core/index.js";
import type { FilesystemError, FilesystemService } from "../index.js";
import {
	normalizeModuleSpecifier,
	stripKnownExtension,
} from "../shared/module-path-utils.js";

// ModulePathValidationResult type moved to core/types/validation-types.ts to avoid duplication

/**
 * Finds similar module paths in directory
 *
 * @param requestedPath - Requested module path
 * @param currentFilePath - Current file path
 * @param fsService - Filesystem service
 * @returns Effect with similar module paths
 *
 * @purity SHELL (uses SHELL service + CORE algorithms)
 * @effect Filesystem I/O
 * @complexity O(n log n) where n = number of files
 */
export const findSimilarModulePaths = (
	requestedPath: string,
	currentFilePath: string,
	fsService: FilesystemService,
): Effect.Effect<readonly SuggestionWithScore[], FilesystemError> =>
	Effect.gen(function* (_) {
		const normalizedRequested = requestedPath.replace(/\\/g, "/");
		const lastSlash = normalizedRequested.lastIndexOf("/");
		const requestedDirectory =
			lastSlash === -1 ? "." : normalizedRequested.slice(0, lastSlash);
		const currentDir = dirname(currentFilePath);

		const targetDirectory = resolve(
			currentDir,
			requestedDirectory === "." ? "." : requestedDirectory,
		);

		const directoryReadResult = yield* _(
			Effect.either(fsService.readDirectory(targetDirectory)),
		);

		const files =
			directoryReadResult._tag === "Right"
				? directoryReadResult.right
				: yield* _(fsService.readDirectory(currentDir));

		const moduleCandidates = files
			.filter((file) => /\.(ts|tsx|js|jsx|json|mjs|cjs)$/.test(file))
			.map((file) => {
				const absoluteCandidate = join(targetDirectory, file);
				const withoutExtension = stripKnownExtension(absoluteCandidate);
				return normalizeModuleSpecifier(currentDir, withoutExtension);
			});

		const uniqueCandidates = [...new Set(moduleCandidates)];
		const validCandidates = uniqueCandidates.filter((candidate) =>
			isValidCandidate(candidate, normalizedRequested),
		);

		return findSimilarCandidates(normalizedRequested, validCandidates);
	});

/**
 * Validates module path and generates suggestions
 *
 * @param node - Import declaration or require call node
 * @param requestedPath - Requested module path
 * @param currentFilePath - Current file path
 * @param fsService - Filesystem service
 * @returns Effect with validation result
 *
 * @purity SHELL (uses SHELL service + CORE algorithms)
 * @effect Filesystem I/O
 * @complexity O(n log n) where n = number of files
 */
export const validateModulePath = (
	node: TSESTree.ImportDeclaration | TSESTree.CallExpression,
	requestedPath: string,
	currentFilePath: string,
	fsService: FilesystemService,
): Effect.Effect<ModulePathValidationResult, FilesystemError> =>
	Effect.gen(function* (_) {
		// CHANGE: Resolve module path
		// WHY: Check if module exists
		const resolvedPath = yield* _(
			Effect.either(
				fsService.resolveModulePath(currentFilePath, requestedPath),
			),
		);

		// CHANGE: If module exists, validation passes
		// WHY: Valid import
		if (resolvedPath._tag === "Right") {
			return { _tag: "Valid" } as const;
		}

		// CHANGE: Find similar module paths
		// WHY: Help user find correct path
		const suggestions = yield* _(
			findSimilarModulePaths(requestedPath, currentFilePath, fsService),
		);

		return {
			_tag: "ModuleNotFound",
			requestedPath,
			suggestions,
			node,
		} as const;
	});

/**
 * Checks if module path exists
 *
 * @param modulePath - Module path to check
 * @param currentFilePath - Current file path
 * @param fsService - Filesystem service
 * @returns Effect with boolean result
 *
 * @purity SHELL (uses SHELL service)
 * @effect Filesystem I/O
 * @complexity O(1)
 */
export const modulePathExists = (
	modulePath: string,
	currentFilePath: string,
	fsService: FilesystemService,
): Effect.Effect<boolean, FilesystemError> =>
	Effect.gen(function* (_) {
		const resolvedPath = yield* _(
			Effect.either(fsService.resolveModulePath(currentFilePath, modulePath)),
		);
		return resolvedPath._tag === "Right";
	});

/**
 * Calculates minimum similarity score based on input length
 *
 * @param inputLength - Length of user input
 * @returns Minimum score threshold
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @invariant result ∈ [0.33, 0.35]
 * @complexity O(1)
 * @throws Never
 *
 * FORMAT THEOREM: minScore = inputLength ≥ 10 ? 0.33 : 0.35
 */
export function calculateMinScore(inputLength: number): number {
	// CHANGE: Lower threshold for longer inputs
	// WHY: Longer strings can tolerate more differences
	// REF: FUNCTIONAL_ARCHITECTURE.md line 362
	return inputLength >= 10 ? 0.33 : 0.35;
}
