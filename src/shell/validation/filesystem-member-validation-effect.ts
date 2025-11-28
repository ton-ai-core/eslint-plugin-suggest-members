/**
 * Filesystem-based member validation effect
 * CHANGE: Create filesystem fallback for member access validation
 * WHY: TypeScript service may fail to provide type information
 * PURITY: SHELL - uses known JavaScript/TypeScript built-in methods
 */

import { Effect } from "effect";

import type { MemberValidationResult } from "../../core/types/validation-types.js";
import {
	makeInvalidMemberResult,
	makeValidResult,
} from "../../core/types/validation-types.js";
import { createSuggestionsWithScore } from "../../core/utils/suggestions.js";
import { getKnownMethodsForType as getKnownMethods } from "./known-type-methods.js";

/**
 * Creates filesystem-based member validation effect for built-in types
 * @param node - ESLint node for error reporting
 * @returns Effect that validates member access using known built-in methods
 * @complexity O(1) - constant time lookup
 * @purity SHELL - uses predefined knowledge of built-in types
 */
export const createFilesystemMemberValidationEffect =
	(node: object) =>
	(
		memberName: string,
		objectType: string,
	): Effect.Effect<MemberValidationResult> =>
		Effect.succeed(
			((): MemberValidationResult => {
				try {
					// CHANGE: Get known methods for common JavaScript types
					// WHY: Provide basic validation for built-in types
					const knownMethods = getKnownMethodsForType(objectType);

					if (knownMethods.length === 0) {
						// CHANGE: Return success if we don't know the type
						// WHY: Don't provide false positives for unknown types
						return makeValidResult();
					}

					if (knownMethods.includes(memberName)) {
						return makeValidResult();
					}

					// CHANGE: Find similar method names
					// WHY: Provide helpful suggestions for typos
					const suggestionsWithScore = createSuggestionsWithScore(
						memberName,
						knownMethods,
					);
					if (suggestionsWithScore.length > 0) {
						return makeInvalidMemberResult(
							memberName,
							suggestionsWithScore,
							node,
						);
					}

					// CHANGE: Return success if no suggestions found
					// WHY: Don't report errors for unknown types without good suggestions
					return makeValidResult();
				} catch {
					// CHANGE: Return success on any error
					// WHY: Don't break linting if validation fails
					return makeValidResult();
				}
			})(),
		);

/**
 * Gets known methods for common JavaScript/TypeScript types
 * @param objectType - Type name or description
 * @returns Array of known method names
 * @complexity O(1) - constant time lookup
 * @purity PURE - no side effects
 */
// CHANGE: Use imported function to reduce complexity
// WHY: Keep functions under 50 lines limit
const getKnownMethodsForType = getKnownMethods;
