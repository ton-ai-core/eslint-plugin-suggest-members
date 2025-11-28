// CHANGE: Effect-based member validation with mathematical guarantees
// WHY: Pure functional composition separating CORE logic from SHELL effects
// PURITY: SHELL (CORE + SHELL composition)
// REF: system-promt.md - функциональная архитектура с Effect-TS

import { Effect, pipe } from "effect";
import { match } from "ts-pattern";
import type { MemberValidationResult } from "../../core/index.js";
import {
	extractPropertyName,
	findSimilarCandidatesEffect,
	formatMemberMessage,
	makeInvalidMemberResult,
	makeValidResult,
	shouldSkipMemberExpression,
} from "../../core/index.js";
import type { SuggestionWithScore } from "../../core/types/domain-types.js";
import {
	isTypeScriptNode,
	type TypeScriptNode,
	type TypeScriptSymbol,
} from "../../core/types/typescript-types.js";
import type { TypeScriptServiceError } from "../effects/errors.js";
import { TypeScriptCompilerServiceTag } from "../services/typescript-compiler-effect.js";

interface MemberPropertyService {
	getTypeAtLocation: (
		node: object,
	) => Effect.Effect<object, TypeScriptServiceError>;
	getPropertiesOfType: (
		type: object,
	) => Effect.Effect<readonly TypeScriptSymbol[], TypeScriptServiceError>;
}

interface MemberSignatureService extends MemberPropertyService {
	getSymbolTypeSignature: (
		symbol: TypeScriptSymbol,
		location?: TypeScriptNode,
	) => Effect.Effect<string | undefined, TypeScriptServiceError>;
}

interface PropertyMetadata {
	readonly names: readonly string[];
	readonly symbols: ReadonlyMap<string, TypeScriptSymbol>;
}

/**
 * Collects property names and symbol map for a TypeScript node
 *
 * @purity SHELL
 * @complexity O(n) where n = |properties|
 */
const collectPropertyMetadata = (
	tsNode: object,
	tsService: MemberPropertyService,
): Effect.Effect<PropertyMetadata, TypeScriptServiceError> =>
	Effect.gen(function* (_) {
		const objectType = yield* _(tsService.getTypeAtLocation(tsNode));
		const properties = yield* _(tsService.getPropertiesOfType(objectType));

		const names = properties.map((prop) => prop.getName());
		const symbols = properties.reduce<ReadonlyMap<string, TypeScriptSymbol>>(
			(map, symbol) => {
				(map as Map<string, TypeScriptSymbol>).set(symbol.getName(), symbol);
				return map;
			},
			new Map(),
		);

		return { names, symbols };
	});

/**
 * Enriches suggestions with TypeScript signatures
 *
 * @purity SHELL
 * @complexity O(n) where n = |suggestions|
 */
const enrichMemberSuggestionsEffect = (
	suggestions: readonly SuggestionWithScore[],
	metadata: PropertyMetadata,
	tsNode: TypeScriptNode | undefined,
	tsService: MemberSignatureService,
): Effect.Effect<readonly SuggestionWithScore[], TypeScriptServiceError> =>
	Effect.all(
		suggestions.map((suggestion) =>
			Effect.gen(function* (_) {
				const symbol = metadata.symbols.get(suggestion.name);
				if (symbol === undefined) {
					return suggestion;
				}

				const signature = yield* _(
					tsService.getSymbolTypeSignature(symbol, tsNode),
				);

				if (signature === undefined || signature.length === 0) {
					return suggestion;
				}

				return {
					name: suggestion.name,
					score: suggestion.score,
					signature,
				} satisfies SuggestionWithScore;
			}),
		),
		{ concurrency: "unbounded" },
	);

/**
 * Builds validation effect using collected metadata
 *
 * @purity SHELL
 * @complexity O(n log n) where n = |properties|
 */
const buildMemberValidationEffect = (
	propertyName: string,
	esTreeNode: object,
	tsNode: object,
	tsService: MemberSignatureService,
): Effect.Effect<MemberValidationResult, TypeScriptServiceError> =>
	pipe(
		collectPropertyMetadata(tsNode, tsService),
		Effect.flatMap((metadata) => {
			if (metadata.names.includes(propertyName)) {
				return Effect.succeed(makeValidResult());
			}

			return pipe(
				findSimilarCandidatesEffect(propertyName, metadata.names),
				Effect.flatMap((suggestions) =>
					// CHANGE: Skip reporting when no candidates found
					// WHY: Avoid empty diagnostics when similarity search yields no matches
					// QUOTE(ТЗ): "Сделай что бы он ничего не отображал если никого не нашёл"
					// REF: user-message-2025-11-04
					// SOURCE: https://eslint.org/docs/latest/extend/custom-rules#contextreport — "context.report() ... publishes a warning or error"
					// FORMAT THEOREM: ∀s ∈ Suggestions: |s| = 0 → Valid(memberAccess)
					// PURITY: SHELL
					// EFFECT: Effect<MemberValidationResult, TypeScriptServiceError, TypeScriptCompilerServiceTag>
					// INVARIANT: No InvalidMember result emitted for empty suggestion sets
					// COMPLEXITY: O(1) guard + existing enrichment cost
					suggestions.length === 0
						? Effect.succeed(makeValidResult())
						: pipe(
								enrichMemberSuggestionsEffect(
									suggestions,
									metadata,
									isTypeScriptNode(tsNode) ? tsNode : undefined,
									tsService,
								),
								Effect.map((enriched) =>
									makeInvalidMemberResult(propertyName, enriched, esTreeNode),
								),
							),
				),
			);
		}),
	);

/**
 * Validates member access with Effect-based composition
 *
 * @param node - Member expression node
 * @returns Effect with validation result
 *
 * @purity SHELL
 * @effect Effect<MemberValidationResult, TypeScriptServiceError, TypeScriptCompilerServiceTag>
 * @invariant Result is Valid | InvalidMember (exhaustive)
 * @complexity O(n log n) where n = |properties|
 * @throws Never - все ошибки типизированы в Effect
 *
 * FORMAT THEOREM: ∀node: validateMemberAccess(node) → Effect<ValidationResult>
 */
export const validateMemberAccessEffect = (
	node: object, // ESLint MemberExpression
): Effect.Effect<
	MemberValidationResult,
	TypeScriptServiceError,
	TypeScriptCompilerServiceTag
> => validateMemberAccessEffectWithNodes(node, node);

/**
 * Validates member access with separate ESTree and TypeScript nodes
 *
 * @param esTreeNode - ESTree MemberExpression node for skip logic
 * @param tsNode - TypeScript node for type checking
 * @returns Effect with validation result
 *
 * @purity SHELL
 * @effect Effect<MemberValidationResult, TypeScriptServiceError, TypeScriptCompilerServiceTag>
 * @invariant Result is Valid | InvalidMember (exhaustive)
 * @complexity O(n log n) where n = |properties|
 * @throws Never - все ошибки типизированы в Effect
 */
export const validateMemberAccessEffectWithNodes = (
	esTreeNode: object, // ESTree MemberExpression
	tsNode: object, // TypeScript node
): Effect.Effect<
	MemberValidationResult,
	TypeScriptServiceError,
	TypeScriptCompilerServiceTag
> =>
	pipe(
		Effect.gen(function* (_) {
			// CHANGE: Early return for nodes that should be skipped
			// WHY: Pure predicate logic in CORE layer
			// PURITY: CORE
			if (shouldSkipMemberExpression(esTreeNode)) {
				return makeValidResult();
			}

			// CHANGE: Extract property name using pure function
			// WHY: Separate pure extraction from effectful validation
			// PURITY: CORE
			const propertyName = extractPropertyName(esTreeNode);
			if (propertyName.length === 0) {
				return makeValidResult();
			}

			const tsService = yield* _(TypeScriptCompilerServiceTag);
			return yield* _(
				buildMemberValidationEffect(
					propertyName,
					esTreeNode,
					tsNode,
					tsService,
				),
			);
		}),
	);

/**
 * Checks if type has accessible properties
 *
 * @param type - TypeScript type
 * @returns Effect with boolean result
 *
 * @purity SHELL
 * @effect Effect<boolean, TypeScriptServiceError, TypeScriptCompilerServiceTag>
 * @complexity O(1)
 * @throws Never
 */
// Moved to shared/existence-utils.ts to avoid duplication
export { hasAccessiblePropertiesEffect } from "../shared/existence-utils.js";

/**
 * Formats member validation result into user message
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
export const formatMemberValidationMessage = (
	result: MemberValidationResult,
): string =>
	match(result)
		.with({ _tag: "Valid" }, () => "")
		.with({ _tag: "InvalidMember" }, (invalid) => {
			const { propertyName, suggestions } = invalid;
			// TODO: Add type name extraction for better error messages
			return formatMemberMessage(propertyName, undefined, suggestions);
		})
		.exhaustive();
