// CHANGE: Module-level TypeScript compiler effects
// WHY: Split large helper collection to satisfy lint max-lines constraint
// PURITY: SHELL

import { Effect, pipe } from "effect";
import * as ts from "typescript";
import type { TypeScriptServiceError } from "../effects/errors.js";
import {
	makeCheckerNotAvailableError,
	makeModuleNotFoundError,
} from "../effects/errors.js";
import {
	getNodeBuiltinExports,
	isNodeBuiltinModule,
} from "./node-builtin-exports.js";
import {
	findContextFile,
	findModuleSymbol,
} from "./typescript-compiler-helpers.js";
import { createUndefinedResultEffect } from "./typescript-effect-utils.js";

/**
 * Try to get built-in module exports
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const tryGetBuiltinExports = (
	modulePath: string,
): readonly string[] | null => {
	if (!isNodeBuiltinModule(modulePath)) {
		return null;
	}
	return getNodeBuiltinExports(modulePath) ?? null;
};

export const resolveContextFileEffect = (
	program: ts.Program,
	modulePath: string,
	containingFilePath?: string,
): Effect.Effect<ts.SourceFile, TypeScriptServiceError, never> =>
	Effect.try({
		try: () => {
			if (containingFilePath !== undefined) {
				const direct = program.getSourceFile(containingFilePath);
				if (direct !== undefined) {
					return direct;
				}
			}
			const fallback = findContextFile(program);
			if (!fallback) {
				throw new Error("context-file-not-found");
			}
			return fallback;
		},
		catch: () => makeModuleNotFoundError(modulePath),
	});

export const resolveModuleSymbolEffect = (
	checker: ts.TypeChecker,
	program: ts.Program,
	modulePath: string,
	contextFile: ts.SourceFile,
): Effect.Effect<ts.Symbol, TypeScriptServiceError, never> =>
	Effect.try({
		try: () => {
			const symbol = findModuleSymbol(
				checker,
				program,
				modulePath,
				contextFile,
			);
			if (!symbol) {
				throw new Error("module-symbol-not-found");
			}
			return symbol;
		},
		catch: () => makeModuleNotFoundError(modulePath),
	});

const filterExportSymbols = (
	checker: ts.TypeChecker,
	exportSymbols: readonly ts.Symbol[],
): string[] => {
	const exportNames: string[] = [];

	for (const symbol of exportSymbols) {
		if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
			let target: ts.Symbol | undefined;
			try {
				target = checker.getAliasedSymbol(symbol);
			} catch {
				target = undefined;
			}

			const hasTargetDeclarations =
				target !== undefined &&
				target.declarations !== undefined &&
				target.declarations.length > 0;

			if (!hasTargetDeclarations) {
				continue;
			}
		}

		exportNames.push(symbol.getName());
	}

	return exportNames;
};

/**
 * Module exports effect with proper module resolution
 *
 * @purity SHELL
 * @complexity O(n) where n = number of exports
 * @effect TypeScript compiler API
 * @invariant ∀ module: resolvable(module) → exports(module) ≠ ∅
 */
export const createGetExportsOfModuleEffect =
	(checker: ts.TypeChecker | undefined, program: ts.Program | undefined) =>
	(
		modulePath: string,
		containingFilePath?: string,
	): Effect.Effect<readonly string[], TypeScriptServiceError, never> =>
		Effect.gen(function* (_) {
			const builtinExports = tryGetBuiltinExports(modulePath);
			if (builtinExports) {
				return builtinExports;
			}

			if (!checker || !program) {
				return yield* _(Effect.fail(makeCheckerNotAvailableError()));
			}

			const contextFile = yield* _(
				resolveContextFileEffect(program, modulePath, containingFilePath),
			);

			const moduleSymbol = yield* _(
				resolveModuleSymbolEffect(checker, program, modulePath, contextFile),
			);

			const exportSymbols = checker.getExportsOfModule(moduleSymbol);
			const exportNames = filterExportSymbols(checker, exportSymbols);

			return exportNames;
		});

/**
 * Module resolution effect
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const createResolveModulePathEffect =
	(program: ts.Program | undefined) =>
	(
		modulePath: string,
		containingFile: string,
	): Effect.Effect<string, TypeScriptServiceError, never> =>
		pipe(
			Effect.sync(() => {
				if (!program) {
					return Effect.fail(makeCheckerNotAvailableError());
				}
				try {
					const resolved = ts.resolveModuleName(
						modulePath,
						containingFile,
						program.getCompilerOptions(),
						ts.sys,
					);

					if (
						resolved.resolvedModule?.resolvedFileName !== undefined &&
						resolved.resolvedModule.resolvedFileName.length > 0
					) {
						return Effect.succeed(resolved.resolvedModule.resolvedFileName);
					}

					return Effect.fail(makeModuleNotFoundError(modulePath));
				} catch {
					return Effect.fail(makeModuleNotFoundError(modulePath));
				}
			}),
			Effect.flatten,
		);

/**
 * Get export type signature effect
 *
 * CHANGE: Added type signature extraction for exports
 * WHY: Display method/property types in suggestions
 *
 * @purity SHELL
 * @complexity O(n) where n = number of exports
 */
export const createGetExportTypeSignatureEffect = (
	checker: ts.TypeChecker | undefined,
	program: ts.Program | undefined,
): ((
	modulePath: string,
	exportName: string,
	containingFilePath?: string,
) => Effect.Effect<string | undefined, TypeScriptServiceError, never>) => {
	if (!checker || !program) {
		return createUndefinedResultEffect<string>();
	}

	return (
		modulePath: string,
		exportName: string,
		containingFilePath?: string,
	): Effect.Effect<string | undefined, TypeScriptServiceError, never> =>
		pipe(
			resolveContextFileEffect(program, modulePath, containingFilePath),
			Effect.flatMap((contextFile) =>
				pipe(
					resolveModuleSymbolEffect(checker, program, modulePath, contextFile),
					Effect.map((moduleSymbol) => ({ contextFile, moduleSymbol })),
				),
			),
			Effect.flatMap(({ contextFile, moduleSymbol }) =>
				Effect.sync(() => {
					const exports = checker.getExportsOfModule(moduleSymbol);
					const targetSymbol = exports.find(
						(exp) => exp.getName() === exportName,
					);

					if (!targetSymbol) {
						return undefined;
					}

					const symbolType = checker.getTypeOfSymbolAtLocation(
						targetSymbol,
						contextFile,
					);

					return checker.typeToString(
						symbolType,
						undefined,
						ts.TypeFormatFlags.NoTruncation |
							ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
					);
				}),
			),
			Effect.catchAll(() => Effect.succeed<string | undefined>(undefined)),
		);
};
