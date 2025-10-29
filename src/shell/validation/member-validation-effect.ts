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
import type { TypeScriptServiceError } from "../effects/errors.js";
import { TypeScriptCompilerServiceTag } from "../services/typescript-compiler-effect.js";

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
> =>
	pipe(
		Effect.gen(function* (_) {
			// CHANGE: Early return for nodes that should be skipped
			// WHY: Pure predicate logic in CORE layer
			// PURITY: CORE
			if (shouldSkipMemberExpression(node)) {
				return makeValidResult();
			}

			// CHANGE: Extract property name using pure function
			// WHY: Separate pure extraction from effectful validation
			// PURITY: CORE
			const propertyName = extractPropertyName(node);
			if (propertyName.length === 0) {
				return makeValidResult();
			}

			// CHANGE: Get TypeScript service from context
			// WHY: Dependency injection pattern
			// PURITY: SHELL
			const tsService = yield* _(TypeScriptCompilerServiceTag);

			// CHANGE: Get type of object being accessed
			// WHY: Need type information for property validation
			// PURITY: SHELL
			const objectType = yield* _(tsService.getTypeAtLocation(node));

			// CHANGE: Get all properties of the type
			// WHY: Need available properties for similarity matching
			// PURITY: SHELL
			const properties = yield* _(tsService.getPropertiesOfType(objectType));

			// CHANGE: Extract property names using pure function
			// WHY: Transform TypeScript symbols to strings
			// PURITY: CORE (pure transformation)
			const propertyNames = properties.map((prop) => prop.getName());

			// CHANGE: Check if property exists
			// WHY: Valid properties don't need suggestions
			// PURITY: CORE
			if (propertyNames.includes(propertyName)) {
				return makeValidResult();
			}

			// CHANGE: Find similar candidates using pure Effect
			// WHY: Separate similarity computation from validation logic
			// PURITY: CORE
			const suggestions = yield* _(
				findSimilarCandidatesEffect(propertyName, propertyNames),
			);

			// CHANGE: Return typed validation result
			// WHY: Type-safe error handling without exceptions
			// PURITY: CORE
			return makeInvalidMemberResult(propertyName, suggestions, node);
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
			const { suggestions } = invalid;
			return formatMemberMessage(suggestions);
		})
		.exhaustive();
