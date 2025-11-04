// CHANGE: Shared TypeScript compiler effect utilities
// WHY: Reduce file size in main compiler effect module while preserving reusable helpers
// PURITY: SHELL

import { Effect, pipe } from "effect";
import * as ts from "typescript";
import {
	isTypeScriptNode,
	isTypeScriptSymbol,
} from "../../core/types/typescript-types.js";
import type { TypeScriptServiceError } from "../effects/errors.js";
import { makeCheckerNotAvailableError } from "../effects/errors.js";

/**
 * Generic TypeScript operation effect factory
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const createTypeScriptEffect = <T>(
	checker: ts.TypeChecker | undefined,
	operation: (
		checker: ts.TypeChecker,
	) => Effect.Effect<T, TypeScriptServiceError, never>,
): Effect.Effect<T, TypeScriptServiceError, never> =>
	pipe(
		Effect.sync(() => {
			if (!checker) {
				return Effect.fail(makeCheckerNotAvailableError());
			}
			return operation(checker);
		}),
		Effect.flatten,
	);

/**
 * Symbol signature extraction effect
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const createGetSymbolTypeSignatureEffect = (
	checker: ts.TypeChecker | undefined,
): ((
	symbol: object,
	fallbackNode?: object,
) => Effect.Effect<string | undefined, TypeScriptServiceError, never>) => {
	if (!checker) {
		return createUndefinedResultEffect<string>();
	}

	return (
		symbol: object,
		fallbackNode?: object,
	): Effect.Effect<string | undefined, TypeScriptServiceError, never> =>
		createTypeScriptEffect(checker, (availableChecker) =>
			Effect.sync(() => {
				if (!isTypeScriptSymbol(symbol)) {
					return undefined;
				}

				const tsSymbol = symbol as ts.Symbol;
				const symbolNodes = [
					tsSymbol.valueDeclaration,
					...(tsSymbol.declarations ?? []),
				].filter((node): node is ts.Declaration => node !== undefined);

				const fallback =
					fallbackNode !== undefined && isTypeScriptNode(fallbackNode)
						? (fallbackNode as ts.Node)
						: undefined;

				const locationNode = symbolNodes[0] ?? fallback;
				if (locationNode === undefined) {
					return undefined;
				}

				try {
					const symbolType = availableChecker.getTypeOfSymbolAtLocation(
						tsSymbol,
						locationNode,
					);

					return availableChecker.typeToString(
						symbolType,
						locationNode,
						ts.TypeFormatFlags.NoTruncation |
							ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
					);
				} catch {
					return undefined;
				}
			}),
		);
};

export const createUndefinedResultEffect =
	<T>() =>
	(): Effect.Effect<T | undefined, TypeScriptServiceError, never> =>
		Effect.succeed<T | undefined>(undefined);
