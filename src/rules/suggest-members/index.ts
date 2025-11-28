// CHANGE: ESLint rule for suggesting similar member names
// WHY: Help users find correct property/method names
// PURITY: INFRASTRUCTURE (ESLint integration)
// REF: FUNCTIONAL_ARCHITECTURE.md - RULES layer
// RULE: suggest-members - validates member access expressions

import type { TSESTree } from "@typescript-eslint/utils";
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";
import type { Layer } from "effect";
import { Effect, pipe } from "effect";
import {
	makeTypeScriptCompilerServiceLayer,
	type TypeScriptCompilerServiceTag,
} from "../../shell/services/typescript-compiler-effect.js";
import { runValidationEffect } from "../../shell/shared/validation-runner.js";
import {
	formatMemberValidationMessage,
	validateMemberAccessEffectWithNodes,
} from "../../shell/validation/member-validation-effect.js";

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
interface NodeMap {
	readonly get: (key: TSESTree.Node) => object | null | undefined;
}

const createValidateAndReport =
	(
		tsServiceLayer: Layer.Layer<TypeScriptCompilerServiceTag>,
		context: RuleContext<"suggestMembers", []>,
		esTreeNodeToTSNodeMap: NodeMap,
	) =>
	(node: TSESTree.MemberExpression): void => {
		// Skip computed properties and optional chaining for now
		if (node.computed || node.optional) return;

		// Skip if property is not an identifier
		if (node.property.type !== AST_NODE_TYPES.Identifier) return;

		// CHANGE: Get TypeScript node for the OBJECT (not the whole MemberExpression)
		// WHY: We need the type of the object being accessed, not the property itself
		const tsObjectNode = esTreeNodeToTSNodeMap.get(node.object);

		if (tsObjectNode === undefined || tsObjectNode === null) {
			// Skip if we can't get TypeScript node for object
			return;
		}

		const validationEffect = pipe(
			validateMemberAccessEffectWithNodes(node, tsObjectNode),
			Effect.provide(tsServiceLayer),
		);

		runValidationEffect({
			validationEffect,
			context,
			reportNode: node.property,
			messageId: "suggestMembers",
			formatMessage: formatMemberValidationMessage,
		});
	};

/**
 * ESLint rule: suggest-members
 *
 * Suggests similar member names when accessing non-existent properties
 *
 * @purity SHELL
 * @effect ESLint reporting, TypeScript type checking
 */
export const suggestMembersRule = createRule({
	name: "suggest-members",
	meta: {
		type: "problem",
		docs: {
			description:
				"enforce correct member names when accessing non-existent properties",
		},
		messages: {
			suggestMembers: "{{message}}",
		},
		schema: [],
	},
	defaultOptions: [],

	create(context) {
		const parserServices = ESLintUtils.getParserServices(context);
		const program = parserServices.program;
		const checker = program.getTypeChecker();
		const esTreeNodeToTSNodeMap = parserServices.esTreeNodeToTSNodeMap;

		const tsServiceLayer = makeTypeScriptCompilerServiceLayer(checker, program);
		const validateAndReport = createValidateAndReport(
			tsServiceLayer,
			context,
			esTreeNodeToTSNodeMap,
		);

		return {
			MemberExpression(node: TSESTree.MemberExpression): void {
				validateAndReport(node);
			},
		};
	},
});
