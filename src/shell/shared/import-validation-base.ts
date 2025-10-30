// CHANGE: Base functionality for import validation rules
// WHY: Eliminate code duplication between suggest-imports and suggest-exports
// PURITY: SHELL (shared validation logic)
// REF: FUNCTIONAL_ARCHITECTURE.md - DRY principle

import type { TSESTree } from "@typescript-eslint/utils";
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type {
	RuleContext,
	RuleModule,
} from "@typescript-eslint/utils/ts-eslint";
import type { Layer } from "effect";
import { Effect } from "effect";

import {
	isTypeOnlyImport,
	shouldSkipIdentifier,
} from "../../core/validators/index.js";
import type { TypeScriptServiceError } from "../effects/errors.js";
import type { TypeScriptCompilerServiceTag } from "../services/typescript-compiler-effect.js";
import { makeTypeScriptCompilerServiceLayer } from "../services/typescript-compiler-effect.js";

/**
 * Base configuration for import validation rules
 *
 * @purity SHELL
 */
export interface ImportValidationConfig<TResult> {
	readonly validateSpecifier: (
		specifier: TSESTree.ImportSpecifier,
		importName: string,
		modulePath: string,
	) => Effect.Effect<
		TResult,
		TypeScriptServiceError,
		TypeScriptCompilerServiceTag
	>;
	readonly formatMessage: (result: TResult) => string;
	readonly messageId: string;
}

/**
 * Creates parser services and TypeScript service layer
 *
 * @param context - ESLint rule context
 * @returns Parser services and TypeScript service layer
 *
 * @purity SHELL
 * @effect ESLint parser services access
 * @complexity O(1)
 * @throws Never
 */
export function createTypeScriptServices(
	context: RuleContext<string, readonly string[]>,
): {
	readonly parserServices: ReturnType<typeof ESLintUtils.getParserServices>;
	readonly tsServiceLayer: Layer.Layer<
		TypeScriptCompilerServiceTag,
		never,
		never
	>;
} {
	const parserServices = ESLintUtils.getParserServices(context);
	const checker = parserServices.program?.getTypeChecker();
	const program = parserServices.program;
	const tsServiceLayer = makeTypeScriptCompilerServiceLayer(checker, program);

	return { parserServices, tsServiceLayer };
}

/**
 * Validates import specifier using provided configuration
 *
 * @param specifier - Import specifier node
 * @param modulePath - Module being imported from
 * @param config - Validation configuration
 * @param context - ESLint rule context
 * @param tsServiceLayer - TypeScript service layer
 *
 * @purity SHELL
 * @effect ESLint reporting, Effect execution
 * @complexity Depends on validation function
 * @throws Never
 */
export function validateImportSpecifierBase<TResult>(
	specifier: TSESTree.ImportSpecifier,
	modulePath: string,
	config: ImportValidationConfig<TResult>,
	context: RuleContext<string, readonly string[]>,
	tsServiceLayer: Layer.Layer<TypeScriptCompilerServiceTag, never, never>,
): void {
	const imported = specifier.imported;
	if (imported.type !== AST_NODE_TYPES.Identifier) return;
	if (shouldSkipIdentifier(imported.name)) return;

	const importName = imported.name;

	// CHANGE: Use provided validation function
	// WHY: Allow different validation logic for different rules
	const validationEffect = Effect.provide(
		config.validateSpecifier(specifier, importName, modulePath),
		tsServiceLayer,
	);

	// CHANGE: Run Effect and handle result
	// WHY: Execute effectful validation
	Effect.runPromise(validationEffect)
		.then((result) => {
			// CHANGE: Check if result indicates an error
			// WHY: Only report if validation found issues
			const message = config.formatMessage(result);
			if (message !== "") {
				context.report({
					node: imported,
					messageId: config.messageId,
					data: { message },
				});
			}
		})
		.catch(() => {
			// CHANGE: Silent error handling for Effect failures
			// WHY: Don't break ESLint execution on validation errors
		});
}

/**
 * Creates import declaration handler using base validation
 *
 * @param config - Validation configuration
 * @param context - ESLint rule context
 * @param tsServiceLayer - TypeScript service layer
 * @returns Import declaration handler function
 *
 * @purity SHELL
 * @effect ESLint node processing
 * @complexity O(n) where n = |import_specifiers|
 * @throws Never
 */
export function createImportDeclarationHandler<TResult>(
	config: ImportValidationConfig<TResult>,
	context: RuleContext<string, readonly string[]>,
	tsServiceLayer: Layer.Layer<TypeScriptCompilerServiceTag, never, never>,
): (node: TSESTree.ImportDeclaration) => void {
	return (node: TSESTree.ImportDeclaration): void => {
		// CHANGE: Skip type-only imports
		// WHY: Type imports have different validation rules
		if (isTypeOnlyImport(node)) return;

		const modulePath = node.source.value;
		if (typeof modulePath !== "string") return;

		// CHANGE: Process only named import specifiers
		// WHY: Only named imports can have export name typos
		const namedSpecifiers = node.specifiers.filter(
			(spec): spec is TSESTree.ImportSpecifier =>
				spec.type === AST_NODE_TYPES.ImportSpecifier,
		);

		for (const specifier of namedSpecifiers) {
			validateImportSpecifierBase(
				specifier,
				modulePath,
				config,
				context,
				tsServiceLayer,
			);
		}
	};
}

/**
 * Creates complete ESLint rule implementation using base validation
 *
 * @param ruleName - Name of the rule
 * @param description - Rule description
 * @param messageId - Message ID for ESLint
 * @param config - Validation configuration
 * @returns Complete ESLint rule
 *
 * @purity SHELL
 * @effect ESLint rule creation
 * @complexity O(1)
 * @throws Never
 */
export function createValidationRule<TResult>(
	ruleName: string,
	description: string,
	messageId: string,
	config: Omit<ImportValidationConfig<TResult>, "messageId">,
): RuleModule<string, readonly string[]> {
	const createRule = ESLintUtils.RuleCreator(
		(name) =>
			`https://github.com/ton-ai-core/eslint-plugin-suggest-members#${name}`,
	);

	return createRule({
		name: ruleName,
		meta: {
			type: "problem",
			docs: {
				description,
			},
			messages: {
				[messageId]: "{{message}}",
			},
			schema: [],
		},
		defaultOptions: [],

		create(context) {
			// CHANGE: Use shared TypeScript services creation
			// WHY: Eliminate code duplication
			const { tsServiceLayer } = createTypeScriptServices(context);

			// CHANGE: Configure validation with provided config
			// WHY: Allow different validation logic for different rules
			const validationConfig = {
				...config,
				messageId,
			};

			// CHANGE: Use shared import declaration handler
			// WHY: Eliminate code duplication
			const handleImportDeclaration = createImportDeclarationHandler(
				validationConfig,
				context,
				tsServiceLayer,
			);

			return {
				ImportDeclaration: handleImportDeclaration,
			};
		},
	});
}
