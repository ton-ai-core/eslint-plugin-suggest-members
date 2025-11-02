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

import { isTypeOnlyImport } from "../../core/validators/index.js";
import type { TypeScriptServiceError } from "../effects/errors.js";
import type { FilesystemService } from "../services/filesystem.js";
import type { TypeScriptCompilerServiceTag } from "../services/typescript-compiler-effect.js";
import { makeTypeScriptCompilerServiceLayer } from "../services/typescript-compiler-effect.js";
import {
	isValidImportIdentifier,
	tryValidationWithFallback,
} from "./validation-helpers.js";

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
	readonly fallbackValidationEffect?: (
		filesystemService: FilesystemService,
	) => (
		importName: string,
		modulePath: string,
		contextFilePath: string,
	) => Effect.Effect<TResult, never, never>;
	readonly formatMessage: (result: TResult) => string;
	readonly messageId: string;
}

/**
 * Validates import specifier using TypeScript service with filesystem fallback
 *
 * @param specifier - Import specifier AST node
 * @param modulePath - Path to the module being imported
 * @param config - Validation configuration
 * @param context - ESLint rule context
 * @param tsServiceLayer - TypeScript service layer
 *
 * @purity SHELL
 * @effect ESLint reporting, Effect execution
 * @complexity O(1) for validation, O(n) for suggestions where n = number of exports
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

	if (!isValidImportIdentifier(imported)) {
		return;
	}

	executeImportValidation({
		imported,
		specifier,
		modulePath,
		config,
		context,
		tsServiceLayer,
	});
}

/**
 * Executes import validation with TypeScript service and fallback
 */
const executeImportValidation = <TResult>(params: {
	imported: TSESTree.Identifier;
	specifier: TSESTree.ImportSpecifier;
	modulePath: string;
	config: ImportValidationConfig<TResult>;
	context: RuleContext<string, readonly string[]>;
	tsServiceLayer: Layer.Layer<TypeScriptCompilerServiceTag, never, never>;
}): void => {
	const { imported, specifier, modulePath, config, context, tsServiceLayer } =
		params;
	const importName = imported.name;
	const validationEffect = Effect.provide(
		config.validateSpecifier(specifier, importName, modulePath),
		tsServiceLayer,
	);

	tryValidationWithFallback({
		imported,
		importName,
		modulePath,
		config,
		context,
		validationEffect,
	});
};

/**
 * Creates complete ESLint rule implementation using base validation
 *
 * @param ruleName - Name of the rule
 * @param description - Rule description
 * @param messageId - Message ID for ESLint
 * @param config - Validation configuration
 * @returns Complete ESLint rule module
 *
 * @purity SHELL
 * @complexity O(1) rule creation, O(n) per validation where n = imports
 */
export function createValidationRule<TResult>(
	_ruleName: string,
	description: string,
	messageId: string,
	config: ImportValidationConfig<TResult>,
): RuleModule<string, readonly string[]> {
	return ESLintUtils.RuleCreator.withoutDocs({
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
		create(context: RuleContext<string, readonly string[]>) {
			// CHANGE: Create TypeScript service layer once per file
			// WHY: Reuse expensive TypeScript compiler setup
			const tsServiceLayer = makeTypeScriptCompilerServiceLayer(
				undefined,
				undefined,
			);

			return {
				ImportDeclaration(node: TSESTree.ImportDeclaration): void {
					// CHANGE: Skip type-only imports
					// WHY: Type imports have different validation rules
					if (isTypeOnlyImport(node)) return;

					const modulePath = node.source.value;
					if (typeof modulePath !== "string") return;

					// CHANGE: Validate each import specifier
					// WHY: Each import needs individual validation
					for (const specifier of node.specifiers) {
						if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
							validateImportSpecifierBase(
								specifier,
								modulePath,
								config,
								context,
								tsServiceLayer,
							);
						}
					}
				},
			};
		},
	});
}
