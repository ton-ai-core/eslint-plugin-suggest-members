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
import type { TypeScriptCompilerService } from "../services/typescript-compiler-effect.js";
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
 * Enriches suggestions with TypeScript type signatures
 *
 * CHANGE: Added type signature enrichment for suggestions
 * WHY: Provide helpful context about what each export/member is
 * FORMAT: Each suggestion gets optional signature like "(str: string) => number"
 *
 * @param suggestions - Base suggestions with only names and scores
 * @param modulePath - Module path to get signatures from
 * @param tsService - TypeScript service for type extraction
 * @returns Effect with enriched suggestions containing signatures
 *
 * @purity SHELL
 * @effect TypeScript Compiler API access
 * @complexity O(n) where n = |suggestions|
 * @throws Never - все ошибки типизированы в Effect
 */
const enrichSuggestionsWithSignatures = (
	suggestions: readonly SuggestionWithScore[],
	modulePath: string,
	containingFilePath: string,
	tsService: TypeScriptCompilerService,
): Effect.Effect<readonly SuggestionWithScore[], TypeScriptServiceError> =>
	Effect.gen(function* (_) {
		// CHANGE: Get type signatures for each suggestion
		// WHY: Provide context about what the suggested export is
		const enriched = yield* _(
			Effect.all(
				suggestions.map((suggestion) =>
					Effect.gen(function* (_) {
						// Try to get type signature for this export
						const signature = yield* _(
							tsService.getExportTypeSignature(
								modulePath,
								suggestion.name,
								containingFilePath,
							),
						);

						// Return suggestion with signature if available
						const result: SuggestionWithScore = {
							name: suggestion.name,
							score: suggestion.score,
							...(signature !== undefined && { signature }),
						};

						return result;
					}),
				),
				{ concurrency: "unbounded" }, // Run in parallel for performance
			),
		);

		return enriched;
	});

/**
 * Builds invalid result effect with enrichment and empty-guard
 *
 * @purity SHELL
 */
interface InvalidResultEffectParams<TResult> {
	readonly name: string;
	readonly modulePath: string;
	readonly node: object;
	readonly containingFilePath: string;
	readonly validCandidates: readonly string[];
	readonly config: BaseValidationConfig<TResult>;
	readonly tsService: TypeScriptCompilerService;
}

const buildInvalidResultEffect = <TResult>(
	params: InvalidResultEffectParams<TResult>,
): Effect.Effect<TResult, TypeScriptServiceError> =>
	pipe(
		findSimilarCandidatesEffect(params.name, params.validCandidates),
		Effect.flatMap((suggestions) =>
			// CHANGE: Skip diagnostics when similarity search returns zero candidates
			// WHY: Respect requirement to suppress messages if no alternatives exist
			// QUOTE(ТЗ): "Сделай что бы он ничего не отображал если никого не нашёл"
			// REF: user-message-2025-11-04
			// SOURCE: https://eslint.org/docs/latest/extend/custom-rules#contextreport — "context.report() ... publishes a warning or error"
			// FORMAT THEOREM: ∀s ∈ Suggestions: |s| = 0 → Valid(importExport)
			// PURITY: SHELL
			// EFFECT: Effect<TResult, TypeScriptServiceError, TypeScriptCompilerServiceTag>
			// INVARIANT: No invalid result emitted when candidate set empty
			// COMPLEXITY: O(1) guard prior to enrichment
			suggestions.length === 0
				? Effect.succeed(params.config.makeValidResult())
				: pipe(
						enrichSuggestionsWithSignatures(
							suggestions,
							params.modulePath,
							params.containingFilePath,
							params.tsService,
						),
						Effect.map((enriched) =>
							params.config.makeInvalidResult(
								params.name,
								params.modulePath,
								enriched,
								params.node,
							),
						),
					),
		),
	);

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
	containingFilePath: string,
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
				tsService.getExportsOfModule(modulePath, containingFilePath),
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

			return yield* _(
				buildInvalidResultEffect({
					name,
					modulePath,
					node,
					containingFilePath,
					validCandidates,
					config,
					tsService,
				}),
			);
		}),
	);
