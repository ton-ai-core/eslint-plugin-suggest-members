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
 * Creates module exports effect
 */
const createGetExportsOfModuleEffect =
	(checker: ts.TypeChecker | null, program: ts.Program | null) =>
	(
		modulePath: string,
	): Effect.Effect<readonly string[], TypeScriptServiceError> => {
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

	return {
		getSymbolAtLocation,
		getTypeAtLocation,
		getPropertiesOfType,
		getExportsOfModule,
		hasExport,
	};
};
