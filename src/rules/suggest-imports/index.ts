// CHANGE: ESLint rule for suggesting similar imports
// WHY: Help users find correct export names
// PURITY: INFRASTRUCTURE (ESLint integration)
// REF: FUNCTIONAL_ARCHITECTURE.md - RULES layer

import type { TSESTree } from "@typescript-eslint/utils";
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { Effect } from "effect";
import { match } from "ts-pattern";
import {
	isTypeOnlyImport,
	shouldSkipIdentifier,
} from "../../core/validators/index.js";
import { makeTypeScriptCompilerServiceLayer } from "../../shell/services/typescript-compiler-effect.js";
import {
	formatImportValidationMessage,
	validateImportSpecifierEffect,
} from "../../shell/validation/import-validation-effect.js";

// CHANGE: Rule metadata
// WHY: ESLint requires metadata for documentation
const createRule = ESLintUtils.RuleCreator(
	(name) =>
		`https://github.com/ton-ai-core/eslint-plugin-suggest-members#${name}`,
);

/**
 * ESLint rule: suggest-imports
 *
 * Suggests similar export names when importing non-existent members
 *
 * @purity SHELL
 * @effect ESLint reporting, TypeScript Compiler API
 */
export const suggestImportsRule = createRule({
	name: "suggest-imports",
	meta: {
		type: "problem",
		docs: {
			description:
				"Suggest similar export names when importing non-existent members",
		},
		messages: {
			suggestImports: "{{message}}",
		},
		schema: [],
	},
	defaultOptions: [],

	create(context) {
		const parserServices = ESLintUtils.getParserServices(context);
		const checker = parserServices.program?.getTypeChecker();
		const program = parserServices.program;
		const tsServiceLayer = makeTypeScriptCompilerServiceLayer(checker, program);

		const validateImportSpecifier = (
			specifier: TSESTree.ImportSpecifier,
			modulePath: string,
		): void => {
			const imported = specifier.imported;
			if (imported.type !== AST_NODE_TYPES.Identifier) return;
			if (shouldSkipIdentifier(imported.name)) return;

			const importName = imported.name;
			const validationEffect = Effect.provide(
				validateImportSpecifierEffect(specifier, importName, modulePath),
				tsServiceLayer,
			);

			Effect.runPromise(validationEffect)
				.then((result) => {
					match(result)
						.with({ _tag: "Valid" }, () => {})
						.with({ _tag: "ImportNotFound" }, () => {
							const message = formatImportValidationMessage(result);
							context.report({
								node: imported,
								messageId: "suggestImports",
								data: { message },
							});
						})
						.exhaustive();
				})
				.catch(() => {});
		};

		return {
			ImportDeclaration(node: TSESTree.ImportDeclaration): void {
				if (isTypeOnlyImport(node)) return;

				const modulePath = node.source.value;
				if (typeof modulePath !== "string") return;

				const specifiers = node.specifiers.filter(
					(spec): spec is TSESTree.ImportSpecifier =>
						spec.type === AST_NODE_TYPES.ImportSpecifier,
				);

				for (const specifier of specifiers) {
					validateImportSpecifier(specifier, modulePath);
				}
			},
		};
	},
});
