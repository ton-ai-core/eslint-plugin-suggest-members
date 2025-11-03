// CHANGE: Effect-based TypeScript Compiler service with mathematical guarantees
// WHY: Pure functional composition with typed effects and dependency injection
// PURITY: SHELL
// REF: system-promt.md - Effect-TS монадическая композиция

import { Context, Effect, Layer, pipe } from "effect";
import * as ts from "typescript";
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
	makeCheckerNotAvailableError,
	makeModuleNotFoundError,
	makeSymbolNotFoundError,
	makeTypeNotFoundError,
	makeTypeResolutionError,
} from "../effects/errors.js";
import {
	getNodeBuiltinExports,
	isNodeBuiltinModule,
} from "./node-builtin-exports.js";
import { findContextFile, findModuleSymbol } from "./typescript-compiler-helpers.js";

/**
 * TypeScript Compiler service interface with Effect-based operations
 *
 * @purity SHELL
 * @effect All operations return Effect for explicit error handling
 */
export interface TypeScriptCompilerService {
	readonly getSymbolAtLocation: (
		node: object,
	) => Effect.Effect<TypeScriptSymbol, TypeScriptServiceError, never>;

	readonly getTypeAtLocation: (
		node: object,
	) => Effect.Effect<TypeScriptType, TypeScriptServiceError, never>;

	readonly getPropertiesOfType: (
		type: object,
	) => Effect.Effect<
		readonly TypeScriptSymbol[],
		TypeScriptServiceError,
		never
	>;

	readonly getExportsOfModule: (
		modulePath: string,
		containingFilePath?: string,
	) => Effect.Effect<readonly string[], TypeScriptServiceError, never>;

	readonly resolveModulePath: (
		modulePath: string,
		containingFile: string,
	) => Effect.Effect<string, TypeScriptServiceError, never>;

	readonly getExportTypeSignature: (
		modulePath: string,
		exportName: string,
		containingFilePath?: string,
	) => Effect.Effect<string | undefined, TypeScriptServiceError, never>;
}

/**
 * TypeScript Compiler service tag for dependency injection
 *
 * @purity SHELL
 */
export class TypeScriptCompilerServiceTag extends Context.Tag(
	"TypeScriptCompilerService",
)<TypeScriptCompilerServiceTag, TypeScriptCompilerService>() {}

/**
 * Creates TypeScript Compiler service implementation
 *
 * @param checker - TypeScript type checker
 * @param program - TypeScript program
 * @returns Service implementation
 *
 * @purity SHELL
 * @effect Creates service with TypeScript API effects
 * @complexity O(1) for service creation
 * @throws Never - все ошибки типизированы в Effect
 */
/**
 * Generic TypeScript operation effect factory
 *
 * @purity SHELL
 * @complexity O(1)
 */
const createTypeScriptEffect = <T>(
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
 * Symbol location effect
 *
 * @purity SHELL
 * @complexity O(1)
 */
const createGetSymbolAtLocationEffect =
	(checker: ts.TypeChecker | undefined) =>
	(
		node: object,
	): Effect.Effect<TypeScriptSymbol, TypeScriptServiceError, never> =>
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
const createGetTypeAtLocationEffect =
	(checker: ts.TypeChecker | undefined) =>
	(
		node: object,
	): Effect.Effect<TypeScriptType, TypeScriptServiceError, never> =>
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
const createGetPropertiesOfTypeEffect =
	(checker: ts.TypeChecker | undefined) =>
	(
		type: object,
	): Effect.Effect<
		readonly TypeScriptSymbol[],
		TypeScriptServiceError,
		never
	> =>
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
 * Try to get built-in module exports
 *
 * @purity SHELL
 * @complexity O(1)
 */
const tryGetBuiltinExports = (modulePath: string): readonly string[] | null => {
	if (!isNodeBuiltinModule(modulePath)) {
		return null;
	}
	return getNodeBuiltinExports(modulePath) ?? null;
};

const resolveContextFileEffect = (
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

const resolveModuleSymbolEffect = (
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

/**
 * Module exports effect with proper module resolution
 *
 * @purity SHELL
 * @complexity O(n) where n = number of exports
 * @effect TypeScript compiler API
 * @invariant ∀ module: resolvable(module) → exports(module) ≠ ∅
 */
	const createGetExportsOfModuleEffect =
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
		});

/**
 * Module resolution effect
 *
 * @purity SHELL
 * @complexity O(1)
 */
const createResolveModulePathEffect =
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
const createGetExportTypeSignatureEffect = (
	checker: ts.TypeChecker | undefined,
	program: ts.Program | undefined,
) => {
	if (!checker || !program) {
		return (): Effect.Effect<
			string | undefined,
			TypeScriptServiceError,
			never
		> => Effect.succeed<string | undefined>(undefined);
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

export const makeTypeScriptCompilerService = (
	checker: ts.TypeChecker | undefined,
	program: ts.Program | undefined,
): TypeScriptCompilerService => ({
	getSymbolAtLocation: createGetSymbolAtLocationEffect(checker),
	getTypeAtLocation: createGetTypeAtLocationEffect(checker),
	getPropertiesOfType: createGetPropertiesOfTypeEffect(checker),
	getExportsOfModule: createGetExportsOfModuleEffect(checker, program),
	resolveModulePath: createResolveModulePathEffect(program),
	getExportTypeSignature: createGetExportTypeSignatureEffect(checker, program),
});

/**
 * Creates TypeScript Compiler service layer
 *
 * @param checker - TypeScript type checker
 * @param program - TypeScript program
 * @returns Service layer for dependency injection
 *
 * @purity SHELL
 * @effect Creates Layer for Effect composition
 * @complexity O(1)
 * @throws Never
 */
export const makeTypeScriptCompilerServiceLayer = (
	checker: ts.TypeChecker | undefined,
	program: ts.Program | undefined,
): Layer.Layer<TypeScriptCompilerServiceTag, never, never> =>
	Layer.succeed(
		TypeScriptCompilerServiceTag,
		makeTypeScriptCompilerService(checker, program),
	);
