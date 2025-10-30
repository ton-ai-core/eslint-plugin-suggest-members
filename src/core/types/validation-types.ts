// CHANGE: Validation result types with exhaustive pattern matching
// WHY: Type-safe validation without runtime exceptions
// PURITY: CORE
// REF: system-promt.md - исчерпывающий паттерн-матчинг

import type { SuggestionWithScore } from "./domain-types.js";

/**
 * Member validation result with typed errors
 *
 * @pure true
 * @purity CORE
 * @invariant Valid | InvalidMember (exhaustive)
 */
export type MemberValidationResult =
	| { readonly _tag: "Valid" }
	| {
			readonly _tag: "InvalidMember";
			readonly propertyName: string;
			readonly suggestions: readonly SuggestionWithScore[];
			readonly node: object; // ESLint node type
	  };

/**
 * Import validation result with typed errors
 *
 * @pure true
 * @purity CORE
 * @invariant Valid | ImportNotFound (exhaustive)
 */
export type ImportValidationResult =
	| { readonly _tag: "Valid" }
	| {
			readonly _tag: "ImportNotFound";
			readonly importName: string;
			readonly modulePath: string;
			readonly suggestions: readonly SuggestionWithScore[];
			readonly node: object; // ESLint node type
	  };

/**
 * Module path validation result with typed errors
 *
 * @pure true
 * @purity CORE
 * @invariant Valid | ModuleNotFound (exhaustive)
 */
export type ModulePathValidationResult =
	| { readonly _tag: "Valid" }
	| {
			readonly _tag: "ModuleNotFound";
			readonly requestedPath: string;
			readonly suggestions: readonly SuggestionWithScore[];
			readonly node: object; // ESLint node type
	  };

/**
 * Creates valid member result
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const makeValidMemberResult = (): MemberValidationResult => ({
	_tag: "Valid",
});

/**
 * Creates valid import result
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const makeValidImportResult = (): ImportValidationResult => ({
	_tag: "Valid",
});

/**
 * Creates valid module result
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const makeValidModuleResult = (): ModulePathValidationResult => ({
	_tag: "Valid",
});

/**
 * Creates valid result (generic - backwards compatibility)
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const makeValidResult = (): MemberValidationResult => ({
	_tag: "Valid",
});

/**
 * Creates invalid member result
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const makeInvalidMemberResult = (
	propertyName: string,
	suggestions: readonly SuggestionWithScore[],
	node: object,
): MemberValidationResult => ({
	_tag: "InvalidMember",
	propertyName,
	suggestions,
	node,
});

/**
 * Creates import not found result
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const makeImportNotFoundResult = (
	importName: string,
	modulePath: string,
	suggestions: readonly SuggestionWithScore[],
	node: object,
): ImportValidationResult => ({
	_tag: "ImportNotFound",
	importName,
	modulePath,
	suggestions,
	node,
});

/**
 * Creates module not found result
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const makeModuleNotFoundResult = (
	requestedPath: string,
	suggestions: readonly SuggestionWithScore[],
	node: object,
): ModulePathValidationResult => ({
	_tag: "ModuleNotFound",
	requestedPath,
	suggestions,
	node,
});

/**
 * Export validation result with typed errors
 *
 * @pure true
 * @purity CORE
 * @invariant Valid | ExportNotFound (exhaustive)
 */
export type ExportValidationResult =
	| { readonly _tag: "Valid" }
	| {
			readonly _tag: "ExportNotFound";
			readonly exportName: string;
			readonly modulePath: string;
			readonly suggestions: readonly SuggestionWithScore[];
			readonly node: object; // ESLint node type
	  };

/**
 * Creates valid export result
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const makeValidExportResult = (): ExportValidationResult => ({
	_tag: "Valid",
});

/**
 * Creates export not found result
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const makeExportNotFoundResult = (
	exportName: string,
	modulePath: string,
	suggestions: readonly SuggestionWithScore[],
	node: object,
): ExportValidationResult => ({
	_tag: "ExportNotFound",
	exportName,
	modulePath,
	suggestions,
	node,
});
