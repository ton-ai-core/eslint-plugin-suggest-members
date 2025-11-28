// CHANGE: Helper functions for import validation
// WHY: Reduce file size and improve modularity
// PURITY: SHELL (validation utilities)

import type { TSESTree } from "@typescript-eslint/utils";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";
import { Effect } from "effect";

import { shouldSkipIdentifier } from "../../core/validators/index.js";
import type { TypeScriptServiceError } from "../effects/errors.js";
import { makeFilesystemService } from "../services/filesystem.js";
import type { ImportValidationConfig } from "./import-validation-base.js";

/**
 * Base parameters for validation functions
 */
interface BaseValidationParams<TResult> {
	readonly imported: TSESTree.Identifier;
	readonly importName: string;
	readonly modulePath: string;
	readonly config: ImportValidationConfig<TResult>;
	readonly context: RuleContext<string, readonly string[]>;
}

/**
 * Checks if import is a valid identifier for validation
 */
export const isValidImportIdentifier = (
	imported: TSESTree.Node,
): imported is TSESTree.Identifier => {
	if (imported.type !== AST_NODE_TYPES.Identifier) {
		return false;
	}
	return !shouldSkipIdentifier(imported.name);
};

/**
 * Tries validation with fallback on error
 */
export const tryValidationWithFallback = <TResult>(
	params: BaseValidationParams<TResult> & {
		readonly validationEffect: Effect.Effect<TResult, TypeScriptServiceError>;
	},
): void => {
	const {
		imported,
		importName,
		modulePath,
		config,
		context,
		validationEffect,
	} = params;
	try {
		const result = Effect.runSync(validationEffect);
		reportValidationResult(imported, config, context, result);
	} catch {
		tryFallbackValidationOnly({
			imported,
			importName,
			modulePath,
			config,
			context,
		});
	}
};

/**
 * Reports validation result if there's an error
 */
export const reportValidationResult = <TResult>(
	imported: TSESTree.Identifier,
	config: ImportValidationConfig<TResult>,
	context: RuleContext<string, readonly string[]>,
	result: TResult,
): void => {
	const message = config.formatMessage(result);
	if (message !== "") {
		context.report({
			node: imported,
			messageId: config.messageId,
			data: { message },
		});
	}
};

/**
 * Tries fallback validation only (when main validation is not available)
 */
export const tryFallbackValidationOnly = <TResult>(
	params: BaseValidationParams<TResult>,
): void => {
	const { imported, importName, modulePath, config, context } = params;
	if (!config.fallbackValidationEffect) {
		return;
	}

	try {
		const filesystemService = makeFilesystemService();
		const fallbackEffect = config.fallbackValidationEffect(filesystemService)(
			importName,
			modulePath,
			context.filename || "",
		);

		const result = Effect.runSync(fallbackEffect);
		reportValidationResult(imported, config, context, result);
	} catch {
		// CHANGE: Silently handle fallback errors
		// WHY: Don't break linting if both methods fail
	}
};
