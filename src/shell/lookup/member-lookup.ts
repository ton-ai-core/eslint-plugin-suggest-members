// CHANGE: Member lookup domain logic
// WHY: Business logic for finding type members
// PURITY: SHELL (CORE + SHELL composition)
// REF: FUNCTIONAL_ARCHITECTURE.md - SHELL layer

import type { TSESTree } from "@typescript-eslint/utils";
import { Effect } from "effect";
import type * as ts from "typescript";
import type { MemberValidationResult } from "../../core/index.js";
import { findSimilarCandidates, isValidCandidate } from "../../core/index.js";
import type {
	TypeScriptCompilerService,
	TypeScriptServiceError,
} from "../index.js";

// MemberValidationResult type moved to core/types/validation-types.ts to avoid duplication

/**
 * Gets all property names from a TypeScript type
 *
 * @param type - TypeScript type
 * @param tsService - TypeScript compiler service
 * @returns Effect with property names
 *
 * @purity SHELL (uses SHELL service)
 * @effect TypeScript Compiler API
 * @complexity O(n) where n = number of properties
 */
export const getPropertyNames = (
	type: ts.Type,
	tsService: TypeScriptCompilerService,
): Effect.Effect<readonly string[], TypeScriptServiceError> =>
	Effect.gen(function* (_) {
		const properties = yield* _(tsService.getPropertiesOfType(type));
		return properties.map((prop) => prop.name);
	});

/**
 * Validates member access and generates suggestions
 *
 * @param node - Member expression node
 * @param propertyName - Accessed property name
 * @param tsService - TypeScript compiler service
 * @returns Effect with validation result
 *
 * @purity SHELL (uses SHELL service + CORE algorithms)
 * @effect TypeScript Compiler API
 * @complexity O(n log n) where n = number of properties
 */
export const validateMemberAccess = (
	node: TSESTree.MemberExpression,
	propertyName: string,
	tsService: TypeScriptCompilerService,
): Effect.Effect<MemberValidationResult, TypeScriptServiceError> =>
	Effect.gen(function* (_) {
		// CHANGE: Get type of object being accessed
		// WHY: Need type to check if property exists
		const objectType = yield* _(tsService.getTypeAtLocation(node.object));

		// CHANGE: Get all properties of the type
		// WHY: Need complete list for similarity checking
		const propertyNames = yield* _(getPropertyNames(objectType, tsService));

		// CHANGE: Check if property exists
		// WHY: Valid property means no error
		if (propertyNames.includes(propertyName)) {
			return { _tag: "Valid" } as const;
		}

		// CHANGE: Filter valid candidates
		// WHY: Remove private members and exact matches
		const validCandidates = propertyNames.filter((candidate) =>
			isValidCandidate(candidate, propertyName),
		);

		// CHANGE: Find similar properties using CORE algorithms
		// WHY: Pure function for testability
		const suggestions = findSimilarCandidates(propertyName, validCandidates);

		return {
			_tag: "InvalidMember",
			propertyName,
			suggestions,
			node,
		} as const;
	});

/**
 * Checks if type has any properties
 *
 * @param type - TypeScript type
 * @param tsService - TypeScript compiler service
 * @returns Effect with boolean result
 *
 * @purity SHELL (uses SHELL service)
 * @effect TypeScript Compiler API
 * @complexity O(1)
 */
export const hasProperties = (
	type: ts.Type,
	tsService: TypeScriptCompilerService,
): Effect.Effect<boolean, TypeScriptServiceError> =>
	Effect.gen(function* (_) {
		const properties = yield* _(tsService.getPropertiesOfType(type));
		return properties.length > 0;
	});
