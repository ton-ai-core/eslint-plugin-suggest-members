// CHANGE: Effect-based export validation with mathematical guarantees
// WHY: Pure functional composition separating CORE logic from SHELL effects
// PURITY: SHELL (CORE + SHELL composition)
// REF: FUNCTIONAL_ARCHITECTURE.md - SHELL layer
// INVARIANT: ∀ export: exists(export) ∨ suggest(similar_exports)

import type { Effect } from "effect";
import { match } from "ts-pattern";

import type { ExportValidationResult } from "../../core/types/validation-types.js";
import {
	makeExportNotFoundResult,
	makeValidExportResult,
} from "../../core/types/validation-types.js";
import type { TypeScriptServiceError } from "../effects/errors.js";
import type { TypeScriptCompilerServiceTag } from "../services/typescript-compiler-effect.js";
import { baseValidationEffect } from "./validation-base-effect.js";

/**
 * Validates export access with Effect-based composition
 *
 * @param node - Import specifier node
 * @param exportName - Name being imported
 * @param modulePath - Module path
 * @returns Effect with validation result
 *
 * @purity SHELL
 * @effect Effect<ExportValidationResult, TypeScriptServiceError, TypeScriptCompilerServiceTag>
 * @invariant Result is Valid | ExportNotFound (exhaustive)
 * @complexity O(n log n) where n = |available_exports|
 * @throws Never - все ошибки типизированы в Effect
 *
 * FORMAT THEOREM: ∀node,name,path: validateExport(node,name,path) → Effect<ValidationResult>
 */
export const validateExportAccessEffect = (
	node: object, // ESLint ImportSpecifier
	exportName: string,
	modulePath: string,
): Effect.Effect<
	ExportValidationResult,
	TypeScriptServiceError,
	TypeScriptCompilerServiceTag
> => {
	// CHANGE: Use base validation with export-specific configuration
	// WHY: Eliminate code duplication with import validation
	const config = {
		makeValidResult: makeValidExportResult,
		makeInvalidResult: makeExportNotFoundResult,
		isValidCandidate: isValidExportCandidate,
	};

	return baseValidationEffect(node, exportName, modulePath, config);
};

/**
 * Validates if candidate is suitable for export suggestions
 *
 * @param candidate - Export candidate
 * @param userInput - User's input
 * @returns true if candidate is valid
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @invariant ∀candidate,input: isValid(candidate,input) ∈ {true, false}
 * @complexity O(1)
 * @throws Never
 */
export const isValidExportCandidate = (
	candidate: string,
	userInput: string,
): boolean => {
	// CHANGE: Skip private exports
	// WHY: Private exports are less likely to be intended
	if (candidate.startsWith("_")) return false;

	// CHANGE: Skip exact matches
	// WHY: Exact matches would have been found already
	if (candidate === userInput) return false;

	// CHANGE: Skip empty names
	// WHY: Empty names are not valid exports
	if (candidate.length === 0) return false;

	// CHANGE: Skip internal TypeScript symbols
	// WHY: Internal symbols are not user-facing
	if (candidate.startsWith("__")) return false;

	// CHANGE: Skip default export in named import context
	// WHY: Default exports have different import syntax
	if (candidate === "default") return false;

	return true;
};

/**
 * Formats export validation result into user message
 *
 * @param result - Validation result
 * @returns Formatted message
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @invariant ∀result: format(result) ∈ String
 * @complexity O(n) where n = |suggestions|
 * @throws Never
 */
export const formatExportValidationMessage = (
	result: ExportValidationResult,
): string =>
	match(result)
		.with({ _tag: "Valid" }, () => "")
		.with({ _tag: "ExportNotFound" }, (invalid) => {
			const { exportName, modulePath, suggestions } = invalid;

			if (suggestions.length === 0) {
				return `Module '${modulePath}' does not export '${exportName}'.`;
			}

			// CHANGE: Format suggestions with similarity scores
			// WHY: Help users understand suggestion quality
			const suggestionList = suggestions.map((s) => `  - ${s.name}`).join("\n");

			return `Module '${modulePath}' does not export '${exportName}'. Did you mean:\n${suggestionList}`;
		})
		.exhaustive();
