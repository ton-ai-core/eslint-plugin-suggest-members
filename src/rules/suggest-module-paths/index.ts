// CHANGE: ESLint rule for suggesting similar module paths
// WHY: Help users find correct import paths
// PURITY: INFRASTRUCTURE (ESLint integration)
// REF: FUNCTIONAL_ARCHITECTURE.md - RULES layer

import type { TSESTree } from "@typescript-eslint/utils";
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";
import { Effect, type Layer, pipe } from "effect";
import { isModulePath } from "../../core/validators/index.js";
import {
	type FilesystemServiceTag,
	makeFilesystemServiceLayer,
} from "../../shell/services/filesystem-effect.js";
import { runValidationEffect } from "../../shell/shared/validation-runner.js";
import {
	formatModulePathValidationMessage,
	validateModulePathEffect,
} from "../../shell/validation/module-validation-effect.js";

// CHANGE: Rule metadata
// WHY: ESLint requires metadata for documentation
const createRule = ESLintUtils.RuleCreator(
	(name) =>
		`https://github.com/ton-ai-core/eslint-plugin-suggest-members#${name}`,
);

/**
 * Creates validation and reporting function
 *
 * @purity SHELL
 * @effect ESLint reporting, Effect composition
 * @complexity O(1) per validation
 */
const createValidateAndReport =
	(
		fsServiceLayer: Layer.Layer<FilesystemServiceTag, never, never>,
		currentFilePath: string,
		context: RuleContext<"suggestModulePaths", []>,
	) =>
	(node: object, reportNode: TSESTree.Node, modulePath: string): void => {
		if (!isModulePath(modulePath)) return;
		if (!modulePath.startsWith("./") && !modulePath.startsWith("../")) return;

		const validationEffect = pipe(
			validateModulePathEffect(node, modulePath, currentFilePath),
			Effect.provide(fsServiceLayer),
		);

		runValidationEffect(
			validationEffect,
			context,
			reportNode,
			"suggestModulePaths",
			formatModulePathValidationMessage,
		);
	};

/**
 * ESLint rule: suggest-module-paths
 *
 * Suggests similar module paths when importing non-existent modules
 *
 * @purity SHELL
 * @effect ESLint reporting, Filesystem I/O
 */
export const suggestModulePathsRule = createRule({
	name: "suggest-module-paths",
	meta: {
		type: "problem",
		docs: {
			description:
				"Suggest similar module paths when importing non-existent modules",
		},
		messages: {
			suggestModulePaths: "{{message}}",
		},
		schema: [],
	},
	defaultOptions: [],

	create(context) {
		const fsServiceLayer = makeFilesystemServiceLayer();
		const currentFilePath = context.filename;
		const validateAndReport = createValidateAndReport(
			fsServiceLayer,
			currentFilePath,
			context,
		);

		return {
			ImportDeclaration(node: TSESTree.ImportDeclaration): void {
				const modulePath = node.source.value;
				if (typeof modulePath !== "string") return;
				validateAndReport(node, node.source, modulePath);
			},

			CallExpression(node: TSESTree.CallExpression): void {
				if (
					node.callee.type !== AST_NODE_TYPES.Identifier ||
					node.callee.name !== "require"
				) {
					return;
				}

				const firstArg = node.arguments[0];
				if (
					firstArg === undefined ||
					(firstArg as { type: string }).type !== "Literal" ||
					typeof (firstArg as { value: string }).value !== "string"
				) {
					return;
				}

				const modulePath = (firstArg as { value: string }).value;
				validateAndReport(node, firstArg, modulePath);
			},
		};
	},
});
