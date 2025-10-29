// CHANGE: Import lookup domain logic
// WHY: Business logic for validating imports
// PURITY: SHELL (CORE + SHELL composition)
// REF: FUNCTIONAL_ARCHITECTURE.md - SHELL layer

import type { TSESTree } from "@typescript-eslint/utils";
import { Effect } from "effect";
import type { ImportValidationResult } from "../../core/index.js";
import { findSimilarCandidates, isValidCandidate } from "../../core/index.js";
import type {
	TypeScriptCompilerService,
	TypeScriptServiceError,
} from "../index.js";

// ImportValidationResult type moved to core/types/validation-types.ts to avoid duplication

/**
 * Validates named import and generates suggestions
 *
 * @param node - Import specifier node
 * @param importName - Imported name
 * @param modulePath - Module path
 * @param tsService - TypeScript compiler service
 * @returns Effect with validation result
 *
 * @purity SHELL (uses SHELL service + CORE algorithms)
 * @effect TypeScript Compiler API
 * @complexity O(n log n) where n = number of exports
 */
export const validateNamedImport = (
	node: TSESTree.ImportSpecifier,
	importName: string,
	modulePath: string,
	tsService: TypeScriptCompilerService,
): Effect.Effect<ImportValidationResult, TypeScriptServiceError> =>
	Effect.gen(function* (_) {
		// CHANGE: Get all exports from module
		// WHY: Need to check if import exists
		const exports = yield* _(tsService.getExportsOfModule(modulePath));

		// CHANGE: Check if export exists
		// WHY: Valid export means no error
		if (exports.includes(importName)) {
			return { _tag: "Valid" } as const;
		}

		// CHANGE: Filter valid candidates
		// WHY: Remove private exports and exact matches
		const validCandidates = exports.filter((candidate) =>
			isValidCandidate(candidate, importName),
		);

		// CHANGE: Find similar exports using CORE algorithms
		// WHY: Pure function for testability
		const suggestions = findSimilarCandidates(importName, validCandidates);

		return {
			_tag: "ImportNotFound",
			importName,
			modulePath,
			suggestions,
			node,
		} as const;
	});

/**
 * Checks if module has any exports
 *
 * @param modulePath - Module path
 * @param tsService - TypeScript compiler service
 * @returns Effect with boolean result
 *
 * @purity SHELL (uses SHELL service)
 * @effect TypeScript Compiler API
 * @complexity O(1)
 */
export const hasExports = (
	modulePath: string,
	tsService: TypeScriptCompilerService,
): Effect.Effect<boolean, TypeScriptServiceError> =>
	Effect.gen(function* (_) {
		const exports = yield* _(tsService.getExportsOfModule(modulePath));
		return exports.length > 0;
	});

/**
 * Checks if specific export exists in module
 *
 * @param modulePath - Module path
 * @param exportName - Export name to check
 * @param tsService - TypeScript compiler service
 * @returns Effect with boolean result
 *
 * @purity SHELL (uses SHELL service)
 * @effect TypeScript Compiler API
 * @complexity O(n) where n = number of exports
 */
export const exportExists = (
	modulePath: string,
	exportName: string,
	tsService: TypeScriptCompilerService,
): Effect.Effect<boolean, TypeScriptServiceError> =>
	tsService.hasExport(modulePath, exportName);
