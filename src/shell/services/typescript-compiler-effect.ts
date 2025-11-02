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
	) => Effect.Effect<readonly string[], TypeScriptServiceError, never>;

	readonly resolveModulePath: (
		modulePath: string,
		containingFile: string,
	) => Effect.Effect<string, TypeScriptServiceError, never>;
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
 * Find context source file for module resolution
 *
 * @purity CORE
 * @complexity O(n) where n = number of source files
 */
const findContextFile = (program: ts.Program): ts.SourceFile | undefined => {
	const files = program.getSourceFiles();
	return (
		files.find((sf) => !sf.isDeclarationFile && sf.fileName.endsWith(".ts")) ||
		files[0]
	);
};

/**
 * Resolve module symbol from resolved module
 *
 * @purity SHELL
 * @complexity O(1)
 */
const resolveModuleSymbol = (
	checker: ts.TypeChecker,
	program: ts.Program,
	moduleResolution: ts.ResolvedModuleWithFailedLookupLocations,
): ts.Symbol | undefined => {
	if (!moduleResolution.resolvedModule) {
		return undefined;
	}

	const resolvedFile = program.getSourceFile(
		moduleResolution.resolvedModule.resolvedFileName,
	);
	return resolvedFile ? checker.getSymbolAtLocation(resolvedFile) : undefined;
};

/**
 * Find module symbol in global scope
 *
 * @purity SHELL
 * @complexity O(n) where n = number of global symbols
 */
const findGlobalModuleSymbol = (
	checker: ts.TypeChecker,
	contextFile: ts.SourceFile,
	modulePath: string,
): ts.Symbol | undefined => {
	const globalSymbols = checker.getSymbolsInScope(
		contextFile,
		ts.SymbolFlags.Module | ts.SymbolFlags.Namespace,
	);

	return globalSymbols.find((symbol) => {
		const name = symbol.getName();
		return (
			name === modulePath ||
			name === `"${modulePath}"` ||
			name.includes(modulePath)
		);
	});
};

/**
 * Find ambient module symbol
 *
 * @purity SHELL
 * @complexity O(n) where n = number of ambient modules
 */
const findAmbientModuleSymbol = (
	checker: ts.TypeChecker,
	modulePath: string,
): ts.Symbol | undefined => {
	const ambientModules = checker.getAmbientModules();
	return ambientModules.find(
		(am) => am.getName() === `"${modulePath}"` || am.getName() === modulePath,
	);
};

/**
 * Extract export names from module symbol
 *
 * @purity SHELL
 * @complexity O(n) where n = number of exports
 */
const extractExportNames = (
	checker: ts.TypeChecker,
	moduleSymbol: ts.Symbol,
): readonly string[] => {
	const exports = checker.getExportsOfModule(moduleSymbol);
	return exports
		.map((exp) => exp.getName())
		.filter((name): name is string => name.length > 0);
};

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

/**
 * Find module symbol using TypeScript resolution
 *
 * @purity SHELL
 * @complexity O(n) where n = number of symbols
 */
const findModuleSymbol = (
	checker: ts.TypeChecker,
	program: ts.Program,
	modulePath: string,
	contextFile: ts.SourceFile,
): ts.Symbol | undefined => {
	const compilerOptions = program.getCompilerOptions();
	const moduleResolution = ts.resolveModuleName(
		modulePath,
		contextFile.fileName,
		compilerOptions,
		ts.sys,
	);

	return (
		resolveModuleSymbol(checker, program, moduleResolution) ||
		findGlobalModuleSymbol(checker, contextFile, modulePath) ||
		findAmbientModuleSymbol(checker, modulePath)
	);
};

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
	): Effect.Effect<readonly string[], TypeScriptServiceError, never> =>
		Effect.gen(function* (_) {
			const builtinExports = tryGetBuiltinExports(modulePath);
			if (builtinExports) {
				return builtinExports;
			}

			if (!checker || !program) {
				return yield* _(Effect.fail(makeCheckerNotAvailableError()));
			}

			try {
				const contextFile = findContextFile(program);
				if (!contextFile) {
					return yield* _(Effect.fail(makeModuleNotFoundError(modulePath)));
				}

				const moduleSymbol = findModuleSymbol(
					checker,
					program,
					modulePath,
					contextFile,
				);

				if (!moduleSymbol) {
					return yield* _(Effect.fail(makeModuleNotFoundError(modulePath)));
				}

				return extractExportNames(checker, moduleSymbol);
			} catch (_error) {
				return yield* _(Effect.fail(makeModuleNotFoundError(modulePath)));
			}
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

export const makeTypeScriptCompilerService = (
	checker: ts.TypeChecker | undefined,
	program: ts.Program | undefined,
): TypeScriptCompilerService => ({
	getSymbolAtLocation: createGetSymbolAtLocationEffect(checker),
	getTypeAtLocation: createGetTypeAtLocationEffect(checker),
	getPropertiesOfType: createGetPropertiesOfTypeEffect(checker),
	getExportsOfModule: createGetExportsOfModuleEffect(checker, program),
	resolveModulePath: createResolveModulePathEffect(program),
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
