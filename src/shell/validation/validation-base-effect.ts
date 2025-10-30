// CHANGE: Base validation effect with shared logic
// WHY: Eliminate code duplication between export and import validation
// PURITY: SHELL (shared validation logic)
// REF: FUNCTIONAL_ARCHITECTURE.md - DRY principle

import { Effect, pipe } from "effect";

import {
	findSimilarCandidatesEffect,
	isTypeOnlyImport,
	shouldSkipIdentifier,
} from "../../core/index.js";
import type { SuggestionWithScore } from "../../core/types/domain-types.js";
import type { TypeScriptServiceError } from "../effects/errors.js";
import { TypeScriptCompilerServiceTag } from "../services/typescript-compiler-effect.js";

/**
 * Base validation configuration for different validation types
 *
 * @purity SHELL
 */
export interface BaseValidationConfig<TResult> {
	readonly makeValidResult: () => TResult;
	readonly makeInvalidResult: (
		name: string,
		modulePath: string,
		suggestions: readonly SuggestionWithScore[],
		node: object,
	) => TResult;
	readonly isValidCandidate: (candidate: string, userInput: string) => boolean;
}

/**
 * Base validation effect with shared logic
 *
 * @param node - Import specifier node
 * @param name - Name being validated
 * @param modulePath - Module path
 * @param config - Validation configuration
 * @returns Effect with validation result
 *
 * @purity SHELL
 * @effect Effect<TResult, TypeScriptServiceError, TypeScriptCompilerServiceTag>
 * @invariant Result is Valid | Invalid (exhaustive)
 * @complexity O(n log n) where n = |available_exports|
 * @throws Never - все ошибки типизированы в Effect
 */
export const baseValidationEffect = <TResult>(
	node: object,
	name: string,
	modulePath: string,
	config: BaseValidationConfig<TResult>,
): Effect.Effect<
	TResult,
	TypeScriptServiceError,
	TypeScriptCompilerServiceTag
> =>
	pipe(
		Effect.gen(function* (_) {
			// CHANGE: Skip type-only imports using pure predicate
			// WHY: Type-only imports have different validation rules
			// PURITY: CORE
			if (isTypeOnlyImport(node)) {
				return config.makeValidResult();
			}

			// CHANGE: Skip identifiers that should not be validated
			// WHY: Some identifiers are special cases
			// PURITY: CORE
			if (shouldSkipIdentifier(name)) {
				return config.makeValidResult();
			}

			// CHANGE: Get TypeScript service from context
			// WHY: Dependency injection pattern
			// PURITY: SHELL
			const tsService = yield* _(TypeScriptCompilerServiceTag);

			// CHANGE: Get all exports from module
			// WHY: Need available exports for validation and suggestions
			// PURITY: SHELL
			const availableExports = yield* _(
				tsService.getExportsOfModule(modulePath),
			);

			// CHANGE: Check if export exists
			// WHY: Valid exports don't need suggestions
			// PURITY: CORE
			if (availableExports.includes(name)) {
				return config.makeValidResult();
			}

			// CHANGE: Filter valid candidates using pure predicate
			// WHY: Remove invalid suggestions before similarity matching
			// PURITY: CORE
			const validCandidates = availableExports.filter((candidate) =>
				config.isValidCandidate(candidate, name),
			);

			// CHANGE: Find similar candidates using pure Effect
			// WHY: Separate similarity computation from validation logic
			// PURITY: CORE
			const suggestions = yield* _(
				findSimilarCandidatesEffect(name, validCandidates),
			);

			// CHANGE: Return typed validation result
			// WHY: Type-safe error handling without exceptions
			// PURITY: CORE
			return config.makeInvalidResult(name, modulePath, suggestions, node);
		}),
	);
