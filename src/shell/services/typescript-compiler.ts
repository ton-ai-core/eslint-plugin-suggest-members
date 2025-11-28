// CHANGE: Effect-based TypeScript Compiler API service
// WHY: Type-safe access to TypeScript type system
// PURITY: SHELL
// REF: CLAUDE.md - Effect-based composition

import type { TSESTree } from "@typescript-eslint/utils";
import { Effect } from "effect";
import type * as ts from "typescript";
import type { TypeScriptServiceError } from "../effects/index.js";
import {
	makeCheckerNotAvailableError,
	makeModuleNotFoundError,
} from "../effects/index.js";
import {
	getNodeBuiltinExports,
	isNodeBuiltinModule,
} from "./node-builtin-exports.js";
import {
	createGetSymbolAtLocationEffect,
	createGetTypeAtLocationEffect,
} from "./shared/typescript-effect-factory.js";

/**
 * TypeScript Compiler service interface
 *
 * @purity SHELL
 * @effect TypeScript Compiler API access
 */
export interface TypeScriptCompilerService {
	/**
	 * Gets symbol at ESLint node location
	 *
	 * @purity SHELL
	 * @effect TypeScript Compiler API
	 * @complexity O(1)
	 */
	readonly getSymbolAtLocation: (
		node: TSESTree.Node,
	) => Effect.Effect<ts.Symbol, TypeScriptServiceError>;

	/**
	 * Gets type at ESLint node location
	 *
	 * @purity SHELL
	 * @effect TypeScript Compiler API
	 * @complexity O(1)
	 */
	readonly getTypeAtLocation: (
		node: TSESTree.Node,
	) => Effect.Effect<ts.Type, TypeScriptServiceError>;

	/**
	 * Gets properties of a type
	 *
	 * @purity SHELL
	 * @effect TypeScript Compiler API
	 * @complexity O(n) where n = number of properties
	 */
	readonly getPropertiesOfType: (
		type: ts.Type,
	) => Effect.Effect<readonly ts.Symbol[], TypeScriptServiceError>;

	/**
	 * Gets exported symbols from a module
	 *
	 * @purity SHELL
	 * @effect TypeScript Compiler API
	 * @complexity O(n) where n = number of exports
	 */
	readonly getExportsOfModule: (
		modulePath: string,
	) => Effect.Effect<readonly string[], TypeScriptServiceError>;

	/**
	 * Checks if symbol exists in module
	 *
	 * @purity SHELL
	 * @effect TypeScript Compiler API
	 * @complexity O(n) where n = number of exports
	 */
	readonly hasExport: (
		modulePath: string,
		exportName: string,
	) => Effect.Effect<boolean, TypeScriptServiceError>;

	/**
	 * Gets type signature string for an export from a module
	 *
	 * CHANGE: Added type signature extraction
	 * WHY: Display method/property types in suggestions for better context
	 *
	 * @purity SHELL
	 * @effect TypeScript Compiler API
	 * @complexity O(n) where n = number of exports
	 * @returns Type signature (e.g., "(str: string) => number") or undefined if not found
	 */
	readonly getExportTypeSignature: (
		modulePath: string,
		exportName: string,
	) => Effect.Effect<string | undefined, TypeScriptServiceError>;
}

/**
 * Creates TypeScript Compiler service from checker and ESLint service
 *
 * @param checker - TypeScript type checker (nullable)
 * @param esTreeNodeToTSNodeMap - Map from ESTree nodes to TS nodes
 * @param program - TypeScript program (nullable)
 * @returns TypeScript Compiler service
 *
 * @purity SHELL
 * @effect Service factory
 * @complexity O(1)
 */
// Moved to shared/typescript-effect-factory.ts to eliminate duplication

/**
 * Creates module exports effect with Node.js built-in support
 */
const createGetExportsOfModuleEffect =
	(checker: ts.TypeChecker | null, program: ts.Program | null) =>
	(
		modulePath: string,
	): Effect.Effect<readonly string[], TypeScriptServiceError> => {
		// CHANGE: Handle Node.js built-in modules first
		// WHY: Built-ins don't have source files but have known exports
		if (isNodeBuiltinModule(modulePath)) {
			const exports = getNodeBuiltinExports(modulePath);
			if (exports) {
				return Effect.succeed(exports);
			}
		}

		if (checker === null || program === null) {
			return Effect.fail(makeCheckerNotAvailableError());
		}

		const sourceFile = program.getSourceFile(modulePath);
		if (sourceFile === undefined) {
			return Effect.fail(makeModuleNotFoundError(modulePath));
		}

		const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
		if (moduleSymbol === undefined) {
			return Effect.succeed([]);
		}

		const exports = checker.getExportsOfModule(moduleSymbol);
		const exportNames = exports.map((exp) => exp.name);

		return Effect.succeed(exportNames);
	};

export const makeTypeScriptCompilerService = (
	checker: ts.TypeChecker | null,
	esTreeNodeToTSNodeMap: WeakMap<TSESTree.Node, ts.Node>,
	program: ts.Program | null,
): TypeScriptCompilerService => {
	const getSymbolAtLocation = createGetSymbolAtLocationEffect(
		checker,
		esTreeNodeToTSNodeMap,
	);
	const getTypeAtLocation = createGetTypeAtLocationEffect(
		checker,
		esTreeNodeToTSNodeMap,
	);
	const getExportsOfModule = createGetExportsOfModuleEffect(checker, program);

	const getPropertiesOfType = (
		type: ts.Type,
	): Effect.Effect<readonly ts.Symbol[], TypeScriptServiceError> => {
		if (checker === null) {
			return Effect.fail(makeCheckerNotAvailableError());
		}
		const properties = checker.getPropertiesOfType(type);
		return Effect.succeed(properties);
	};

	const hasExport = (
		modulePath: string,
		exportName: string,
	): Effect.Effect<boolean, TypeScriptServiceError> =>
		Effect.gen(function* (_) {
			const exports = yield* _(getExportsOfModule(modulePath));
			return exports.includes(exportName);
		});

	// CHANGE: Removed getExportTypeSignature implementation
	// WHY: Not used in this legacy service, only in Effect-based service
	// NOTE: This service is legacy and will be deprecated
	const getExportTypeSignature = (
		modulePath: string,
		exportName: string,
	): Effect.Effect<string | undefined, TypeScriptServiceError> => {
		// CHANGE: Preserve legacy signature while returning empty result
		// WHY: Interface requires parameters even if not used in legacy path
		void modulePath;
		void exportName;
		return Effect.succeed(undefined);
	};

	return {
		getSymbolAtLocation,
		getTypeAtLocation,
		getPropertiesOfType,
		getExportsOfModule,
		hasExport,
		getExportTypeSignature,
	};
};
