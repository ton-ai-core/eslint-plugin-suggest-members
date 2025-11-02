// CHANGE: Effect-based import validation with mathematical guarantees
// WHY: Pure functional composition separating CORE logic from SHELL effects
// PURITY: SHELL (CORE + SHELL composition)
// REF: system-promt.md - функциональная архитектура с Effect-TS

import type { Effect } from "effect";
import { match } from "ts-pattern";
import type { ImportValidationResult } from "../../core/index.js";
import {
	formatImportMessage,
	makeImportNotFoundResult,
	makeValidImportResult,
} from "../../core/index.js";
import type { TypeScriptServiceError } from "../effects/errors.js";
import type { TypeScriptCompilerServiceTag } from "../services/typescript-compiler-effect.js";
import { baseValidationEffect } from "./validation-base-effect.js";

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
> => {
	// CHANGE: Use base validation with import-specific configuration
	// WHY: Eliminate code duplication with export validation
	const config = {
		makeValidResult: makeValidImportResult,
		makeInvalidResult: makeImportNotFoundResult,
		isValidCandidate: isValidImportCandidate,
	};

	return baseValidationEffect(node, importName, modulePath, config);
};

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
				return `Cannot find export "${importName}" in module "${modulePath}".`;
			}
			return formatImportMessage(importName, modulePath, suggestions);
		})
		.exhaustive();
