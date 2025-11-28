import { Effect, pipe } from "effect";
import type * as ts from "typescript";
import type {
	TypeScriptSymbol,
	TypeScriptType,
} from "../../core/types/typescript-types.js";
import {
	isTypeScriptSymbol,
	isTypeScriptType,
} from "../../core/types/typescript-types.js";
import type { TypeScriptServiceError } from "../effects/errors.js";
import {
	makeSymbolNotFoundError,
	makeTypeNotFoundError,
	makeTypeResolutionError,
} from "../effects/errors.js";
import { createTypeScriptEffect } from "./typescript-effect-utils.js";

/**
 * Symbol location effect
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const createGetSymbolAtLocationEffect =
	(checker: ts.TypeChecker | undefined) =>
	(node: object): Effect.Effect<TypeScriptSymbol, TypeScriptServiceError> =>
		createTypeScriptEffect(checker, (checker) =>
			pipe(
				Effect.sync(() => checker.getSymbolAtLocation(node as ts.Node)),
				Effect.flatMap((symbol) => {
					if (!symbol) {
						return Effect.fail(makeSymbolNotFoundError("unknown"));
					}
					if (!isTypeScriptSymbol(symbol)) {
						return Effect.fail(makeSymbolNotFoundError("invalid symbol type"));
					}
					return Effect.succeed(symbol);
				}),
			),
		);

/**
 * Type location effect
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const createGetTypeAtLocationEffect =
	(checker: ts.TypeChecker | undefined) =>
	(node: object): Effect.Effect<TypeScriptType, TypeScriptServiceError> =>
		createTypeScriptEffect(checker, (checker) =>
			pipe(
				Effect.try({
					try: () => checker.getTypeAtLocation(node as ts.Node),
					catch: () => makeTypeNotFoundError("unknown"),
				}),
				Effect.flatMap((type) => {
					if (!isTypeScriptType(type)) {
						return Effect.fail(makeTypeNotFoundError("invalid type"));
					}
					return Effect.succeed(type);
				}),
			),
		);

/**
 * Type properties effect
 *
 * @purity SHELL
 * @complexity O(n)
 */
export const createGetPropertiesOfTypeEffect =
	(checker: ts.TypeChecker | undefined) =>
	(
		type: object,
	): Effect.Effect<readonly TypeScriptSymbol[], TypeScriptServiceError> =>
		createTypeScriptEffect(checker, (checker) =>
			pipe(
				Effect.try({
					try: () => checker.getPropertiesOfType(type as ts.Type),
					catch: (error) =>
						makeTypeResolutionError(
							error instanceof Error ? error.message : "Unknown error",
						),
				}),
				Effect.map((properties) => properties.filter(isTypeScriptSymbol)),
			),
		);

/**
 * Module-specific effects moved to typescript-compiler-module-effects.ts
 */
