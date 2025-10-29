// CHANGE: ESLint rule for suggesting similar members
// WHY: Help users find correct property names
// PURITY: INFRASTRUCTURE (ESLint integration)
// REF: FUNCTIONAL_ARCHITECTURE.md - RULES layer

import type { TSESTree } from "@typescript-eslint/utils";
import { ESLintUtils } from "@typescript-eslint/utils";
import { Effect } from "effect";

import {
	extractPropertyName,
	shouldSkipMemberExpression,
} from "../../core/validators/index.js";
import { makeTypeScriptCompilerServiceLayer } from "../../shell/services/typescript-compiler-effect.js";
import { runValidationEffect } from "../../shell/shared/validation-runner.js";
import {
	formatMemberValidationMessage,
	validateMemberAccessEffect,
} from "../../shell/validation/member-validation-effect.js";

// CHANGE: Rule metadata
// WHY: ESLint requires metadata for documentation
const createRule = ESLintUtils.RuleCreator(
	(name) =>
		`https://github.com/ton-ai-core/eslint-plugin-suggest-members#${name}`,
);

/**
 * ESLint rule: suggest-members
 *
 * Suggests similar property names when accessing non-existent members
 *
 * @purity SHELL
 * @effect ESLint reporting, TypeScript Compiler API
 */
export const suggestMembersRule = createRule({
	name: "suggest-members",
	meta: {
		type: "problem",
		docs: {
			description:
				"Suggest similar member names when accessing non-existent properties",
		},
		messages: {
			suggestMembers: "{{message}}",
		},
		schema: [],
	},
	defaultOptions: [],

	create(context) {
		// CHANGE: Get TypeScript services from parser
		// WHY: Need type checker for property validation
		const parserServices = ESLintUtils.getParserServices(context);
		const checker = parserServices.program?.getTypeChecker();
		const program = parserServices.program;

		// CHANGE: Create TypeScript service layer
		// WHY: Effect-based dependency injection
		const tsServiceLayer = makeTypeScriptCompilerServiceLayer(checker, program);

		return {
			MemberExpression(node: TSESTree.MemberExpression): void {
				// CHANGE: Use CORE predicate for skip logic
				// WHY: Pure decision logic in CORE layer
				if (shouldSkipMemberExpression(node)) {
					return;
				}

				// CHANGE: Extract property name using CORE function
				// WHY: Pure extraction logic
				const propertyName = extractPropertyName(node);
				if (propertyName === "") {
					return;
				}

				// CHANGE: Get TypeScript node for validation
				// WHY: Need TypeScript node for type checking
				const esTreeNodeToTSNodeMap = parserServices.esTreeNodeToTSNodeMap;
				const tsNode = esTreeNodeToTSNodeMap.get(node.object);

				// CHANGE: Validate member access using Effect-based DOMAIN logic
				// WHY: Pure functional composition with typed effects
				const validationEffect = Effect.provide(
					validateMemberAccessEffect(tsNode),
					tsServiceLayer,
				);

				// CHANGE: Run Effect and handle result
				// WHY: Execute effectful validation using shared runner
				runValidationEffect(
					validationEffect,
					context,
					node.property,
					"suggestMembers",
					formatMemberValidationMessage,
				);
			},
		};
	},
});
