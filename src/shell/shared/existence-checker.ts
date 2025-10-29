// CHANGE: Shared existence checker to eliminate duplication
// WHY: Common pattern for checking if exports/properties exist
// PURITY: SHELL
// REF: system-promt.md - DRY principle

import { Effect, pipe } from "effect";
import type { TypeScriptServiceError } from "../effects/errors.js";
import type { TypeScriptCompilerServiceTag } from "../services/typescript-compiler-effect.js";

// Moved to existence-utils.ts to avoid duplication
import { withTypeScriptService } from "./existence-utils.js";

/**
 * Generic existence checker for TypeScript entities
 *
 * @purity SHELL
 * @complexity O(n) where n = number of entities to check
 */
export const checkExistenceEffect = <T>(
	entityName: string,
	getEntitiesEffect: Effect.Effect<
		readonly T[],
		TypeScriptServiceError,
		TypeScriptCompilerServiceTag
	>,
	entityMatcher: (entity: T, name: string) => boolean,
): Effect.Effect<
	boolean,
	TypeScriptServiceError,
	TypeScriptCompilerServiceTag
> =>
	pipe(
		getEntitiesEffect,
		Effect.map((entities) =>
			entities.some((entity) => entityMatcher(entity, entityName)),
		),
	);

/**
 * Checks if export exists in module
 *
 * @purity SHELL
 * @complexity O(n) where n = number of exports
 */
export const checkExportExistsEffect = (
	modulePath: string,
	exportName: string,
): Effect.Effect<
	boolean,
	TypeScriptServiceError,
	TypeScriptCompilerServiceTag
> =>
	withTypeScriptService((tsService) =>
		pipe(
			tsService.getExportsOfModule(modulePath),
			Effect.map((exports: readonly string[]) => exports.includes(exportName)),
		),
	);

/**
 * Checks if property exists in type
 *
 * @purity SHELL
 * @complexity O(n) where n = number of properties
 */
export const checkPropertyExistsEffect = (
	type: object,
	propertyName: string,
): Effect.Effect<
	boolean,
	TypeScriptServiceError,
	TypeScriptCompilerServiceTag
> =>
	withTypeScriptService((tsService) =>
		pipe(
			tsService.getPropertiesOfType(type),
			Effect.map(
				(
					properties: ReadonlyArray<
						import("../../core/types/typescript-types.js").TypeScriptSymbol
					>,
				) => properties.some((prop) => prop.name === propertyName),
			),
		),
	);
