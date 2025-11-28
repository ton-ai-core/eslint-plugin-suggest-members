// CHANGE: Effect-based TypeScript Compiler service with mathematical guarantees
// WHY: Pure functional composition with typed effects and dependency injection
// PURITY: SHELL
// REF: system-promt.md - Effect-TS монадическая композиция

import type { Effect } from "effect";
import { Context, Layer } from "effect";
import type * as ts from "typescript";
import type {
	TypeScriptNode,
	TypeScriptSymbol,
	TypeScriptType,
} from "../../core/types/typescript-types.js";
import type { TypeScriptServiceError } from "../effects/errors.js";
import {
	createGetPropertiesOfTypeEffect,
	createGetSymbolAtLocationEffect,
	createGetTypeAtLocationEffect,
} from "./typescript-compiler-effects.js";
import {
	createGetExportsOfModuleEffect,
	createGetExportTypeSignatureEffect,
	createResolveModulePathEffect,
} from "./typescript-compiler-module-effects.js";
import { createGetSymbolTypeSignatureEffect } from "./typescript-effect-utils.js";

/**
 * TypeScript Compiler service interface with Effect-based operations
 *
 * @purity SHELL
 * @effect All operations return Effect for explicit error handling
 */
export interface TypeScriptCompilerService {
	readonly getSymbolAtLocation: (
		node: object,
	) => Effect.Effect<TypeScriptSymbol, TypeScriptServiceError>;

	readonly getTypeAtLocation: (
		node: object,
	) => Effect.Effect<TypeScriptType, TypeScriptServiceError>;

	readonly getPropertiesOfType: (
		type: object,
	) => Effect.Effect<readonly TypeScriptSymbol[], TypeScriptServiceError>;

	readonly getExportsOfModule: (
		modulePath: string,
		containingFilePath?: string,
	) => Effect.Effect<readonly string[], TypeScriptServiceError>;

	readonly resolveModulePath: (
		modulePath: string,
		containingFile: string,
	) => Effect.Effect<string, TypeScriptServiceError>;

	readonly getExportTypeSignature: (
		modulePath: string,
		exportName: string,
		containingFilePath?: string,
	) => Effect.Effect<string | undefined, TypeScriptServiceError>;

	/**
	 * Retrieves textual type signature for a symbol (method/property)
	 *
	 * @param symbol - TypeScript symbol representing the member
	 * @param location - Optional fallback node for type resolution
	 * @returns Effect with signature string or undefined when unavailable
	 *
	 * @purity SHELL
	 * @effect Effect<string | undefined, TypeScriptServiceError, never>
	 * @invariant signature => signature.length > 0
	 * @complexity O(1)
	 * @throws Never - ошибки типизированы в Effect
	 */
	readonly getSymbolTypeSignature: (
		symbol: TypeScriptSymbol,
		location?: TypeScriptNode,
	) => Effect.Effect<string | undefined, TypeScriptServiceError>;
}

/**
 * TypeScript Compiler service tag for dependency injection
 *
 * @purity SHELL
 */
export class TypeScriptCompilerServiceTag extends Context.Tag(
	"TypeScriptCompilerService",
)<TypeScriptCompilerServiceTag, TypeScriptCompilerService>() {}

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
	getSymbolTypeSignature: createGetSymbolTypeSignatureEffect(checker),
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
): Layer.Layer<TypeScriptCompilerServiceTag> =>
	Layer.succeed(
		TypeScriptCompilerServiceTag,
		makeTypeScriptCompilerService(checker, program),
	);
