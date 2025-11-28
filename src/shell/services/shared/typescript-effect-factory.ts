// CHANGE: Shared TypeScript effect factory to eliminate duplication
// WHY: Common patterns for creating TypeScript compiler effects
// PURITY: SHELL
// REF: system-promt.md - DRY principle

import type { TSESTree } from "@typescript-eslint/utils";
import { Effect } from "effect";
import type * as ts from "typescript";
import type { TypeScriptServiceError } from "../../effects/index.js";
import {
	makeCheckerNotAvailableError,
	makeSymbolNotFoundError,
	makeTypeNotFoundError,
} from "../../effects/index.js";

/**
 * Extracts node name for error reporting
 *
 * @purity CORE
 * @complexity O(1)
 */
export const getNodeName = (node: TSESTree.Node): string => {
	if (
		"property" in node &&
		typeof node.property === "object" &&
		"name" in node.property &&
		typeof node.property.name === "string"
	) {
		return node.property.name;
	}

	if ("name" in node && typeof node.name === "string") {
		return node.name;
	}

	return "unknown";
};

/**
 * Generic TypeScript node effect factory
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const createNodeEffect =
	<T>(
		checker: ts.TypeChecker | null,
		esTreeNodeToTSNodeMap: WeakMap<TSESTree.Node, ts.Node>,
		operation: (checker: ts.TypeChecker, tsNode: ts.Node) => T | undefined,
		errorFactory: (nodeName: string) => TypeScriptServiceError,
	) =>
	(node: TSESTree.Node): Effect.Effect<T, TypeScriptServiceError> => {
		if (checker === null) {
			return Effect.fail(makeCheckerNotAvailableError());
		}

		const tsNode = esTreeNodeToTSNodeMap.get(node);
		if (tsNode === undefined) {
			return Effect.fail(errorFactory(getNodeName(node)));
		}

		const result = operation(checker, tsNode);
		if (result === undefined) {
			return Effect.fail(errorFactory(getNodeName(node)));
		}

		return Effect.succeed(result);
	};

/**
 * Creates symbol location effect using shared factory
 */
export const createGetSymbolAtLocationEffect = (
	checker: ts.TypeChecker | null,
	esTreeNodeToTSNodeMap: WeakMap<TSESTree.Node, ts.Node>,
): ((
	node: TSESTree.Node,
) => Effect.Effect<ts.Symbol, TypeScriptServiceError>) =>
	createNodeEffect(
		checker,
		esTreeNodeToTSNodeMap,
		(checker, tsNode) => checker.getSymbolAtLocation(tsNode),
		makeSymbolNotFoundError,
	);

/**
 * Creates type location effect using shared factory
 */
export const createGetTypeAtLocationEffect = (
	checker: ts.TypeChecker | null,
	esTreeNodeToTSNodeMap: WeakMap<TSESTree.Node, ts.Node>,
): ((node: TSESTree.Node) => Effect.Effect<ts.Type, TypeScriptServiceError>) =>
	createNodeEffect(
		checker,
		esTreeNodeToTSNodeMap,
		(checker, tsNode) => checker.getTypeAtLocation(tsNode),
		makeTypeNotFoundError,
	);
