// CHANGE: Effect-based import validation with mathematical guarantees
// WHY: Pure functional composition separating CORE logic from SHELL effects
// PURITY: SHELL (CORE + SHELL composition)
// REF: system-promt.md - функциональная архитектура с Effect-TS

import { Effect, pipe } from "effect";
import { match } from "ts-pattern";
import type { ImportValidationResult } from "../../core/index.js";
import {
	findSimilarCandidatesEffect,
	isTypeOnlyImport,
	makeImportNotFoundResult,
	makeValidImportResult,
	shouldSkipIdentifier,
} from "../../core/index.js";
import type { TypeScriptServiceError } from "../effects/errors.js";
import { TypeScriptCompilerServiceTag } from "../services/typescript-compiler-effect.js";

/**
 * Validates import specifier with Effect-based composition
 *
 * @param node - Import specifier node
 * @param importName - Name being imported
 * @param modulePath - Module path
 * @returns Effect with validation result
 *
 * @purity SHELL
 * @effect Effect<ImportValidationResult, TypeScriptServiceError, TypeScriptCompilerServiceTag>
 * @invariant Result is Valid | ImportNotFound (exhaustive)
 * @complexity O(n log n) where n = |exports|
 * @throws Never - все ошибки типизированы в Effect
 *
 * FORMAT THEOREM: ∀node,name,path: validateImport(node,name,path) → Effect<ValidationResult>
 */
export const validateImportSpecifierEffect = (
	node: object, // ESLint ImportSpecifier
	importName: string,
	modulePath: string,
): Effect.Effect<
	ImportValidationResult,
	TypeScriptServiceError,
	TypeScriptCompilerServiceTag
> =>
	pipe(
		Effect.gen(function* (_) {
			// CHANGE: Skip type-only imports using pure predicate
			// WHY: Type-only imports have different validation rules
			// PURITY: CORE
			if (isTypeOnlyImport(node)) {
				return makeValidImportResult();
			}

			// CHANGE: Skip identifiers that should not be validated
			// WHY: Some identifiers are special cases
			// PURITY: CORE
			if (shouldSkipIdentifier(importName)) {
				return makeValidImportResult();
			}

			// CHANGE: Get TypeScript service from context
			// WHY: Dependency injection pattern
			// PURITY: SHELL
			const tsService = yield* _(TypeScriptCompilerServiceTag);

			// CHANGE: Get all exports from module
			// WHY: Need available exports for validation and suggestions
			// PURITY: SHELL
			const exports = yield* _(tsService.getExportsOfModule(modulePath));

			// CHANGE: Check if import exists
			// WHY: Valid imports don't need suggestions
			// PURITY: CORE
			if (exports.includes(importName)) {
				return makeValidImportResult();
			}

			// CHANGE: Filter valid candidates using pure predicate
			// WHY: Remove invalid suggestions before similarity matching
			// PURITY: CORE
			const validCandidates = exports.filter((candidate) =>
				isValidImportCandidate(candidate, importName),
			);

			// CHANGE: Find similar candidates using pure Effect
			// WHY: Separate similarity computation from validation logic
			// PURITY: CORE
			const suggestions = yield* _(
				findSimilarCandidatesEffect(importName, validCandidates),
			);

			// CHANGE: Return typed validation result
			// WHY: Type-safe error handling without exceptions
			// PURITY: CORE
			return makeImportNotFoundResult(
				importName,
				modulePath,
				suggestions,
				node,
			);
		}),
	);

/**
 * Checks if module has exports
 *
 * @param modulePath - Module path to check
 * @returns Effect with boolean result
 *
 * @purity SHELL
 * @effect Effect<boolean, TypeScriptServiceError, TypeScriptCompilerServiceTag>
 * @complexity O(1)
 * @throws Never
 */
// Moved to shared/existence-utils.ts to avoid duplication
export { hasExportsEffect as hasModuleExportsEffect } from "../shared/existence-utils.js";

/**
 * Validates if candidate is suitable for import suggestions
 *
 * @param candidate - Export candidate
 * @param userInput - User's input
 * @returns true if candidate is valid
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(1)
 * @throws Never
 */
export const isValidImportCandidate = (
	candidate: string,
	userInput: string,
): boolean => {
	// Skip private exports
	if (candidate.startsWith("_")) return false;

	// Skip exact matches
	if (candidate === userInput) return false;

	// Skip empty names
	if (candidate.length === 0) return false;

	// Skip internal TypeScript symbols
	if (candidate.startsWith("__")) return false;

	return true;
};

/**
 * Formats import validation result into user message
 *
 * @param result - Validation result
 * @returns Formatted message
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(n) where n = |suggestions|
 * @throws Never
 */
export const formatImportValidationMessage = (
	result: ImportValidationResult,
): string =>
	match(result)
		.with({ _tag: "Valid" }, () => "")
		.with({ _tag: "ImportNotFound" }, (invalid) => {
			const { importName, modulePath, suggestions } = invalid;
			if (suggestions.length === 0) {
				return `Module '${modulePath}' does not export '${importName}'.`;
			}

			const suggestionList = suggestions
				.map((s) => `'${s.name}' (${(s.score * 100).toFixed(0)}%)`)
				.join(", ");

			return `Module '${modulePath}' does not export '${importName}'. Did you mean: ${suggestionList}?`;
		})
		.exhaustive();
