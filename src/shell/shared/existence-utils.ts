// CHANGE: Shared existence utilities to eliminate duplication
// WHY: Common patterns for checking if collections have elements
// PURITY: SHELL
// REF: system-promt.md - DRY principle

import { Effect, pipe } from "effect";
import type { TypeScriptServiceError } from "../effects/errors.js";
import { TypeScriptCompilerServiceTag } from "../services/typescript-compiler-effect.js";

/**
 * Generic collection existence checker
 *
 * @purity SHELL
 * @complexity O(1)
 */
const checkCollectionHasElements = <T>(
	collectionEffect: Effect.Effect<
		readonly T[],
		TypeScriptServiceError,
		TypeScriptCompilerServiceTag
	>,
): Effect.Effect<
	boolean,
	TypeScriptServiceError,
	TypeScriptCompilerServiceTag
> =>
	pipe(
		collectionEffect,
		Effect.map((collection) => collection.length > 0),
	);

/**
 * Generic TypeScript service operation
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const withTypeScriptService = <T>(
	operation: (
		tsService: import("../services/typescript-compiler-effect.js").TypeScriptCompilerService,
	) => Effect.Effect<T, TypeScriptServiceError, TypeScriptCompilerServiceTag>,
): Effect.Effect<T, TypeScriptServiceError, TypeScriptCompilerServiceTag> =>
	pipe(
		Effect.gen(function* (_) {
			const tsService = yield* _(TypeScriptCompilerServiceTag);
			return yield* _(operation(tsService));
		}),
	);

/**
 * Checks if module has exports
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const hasExportsEffect = (
	modulePath: string,
): Effect.Effect<
	boolean,
	TypeScriptServiceError,
	TypeScriptCompilerServiceTag
> =>
	withTypeScriptService((tsService) =>
		checkCollectionHasElements(tsService.getExportsOfModule(modulePath)),
	);

/**
 * Checks if type has accessible properties
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const hasAccessiblePropertiesEffect = (
	type: object,
): Effect.Effect<
	boolean,
	TypeScriptServiceError,
	TypeScriptCompilerServiceTag
> =>
	withTypeScriptService((tsService) =>
		checkCollectionHasElements(tsService.getPropertiesOfType(type)),
	);
