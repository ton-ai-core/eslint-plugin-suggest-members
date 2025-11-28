// CHANGE: Base functionality for import validation rules
// WHY: Eliminate code duplication between suggest-imports and suggest-exports
import type { TSESTree } from "@typescript-eslint/utils";
import { ESLintUtils } from "@typescript-eslint/utils";
import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";
import type { Layer } from "effect";
import { Effect } from "effect";

import type { TypeScriptServiceError } from "../effects/errors.js";
import type { FilesystemService } from "../services/filesystem.js";
import type { TypeScriptCompilerServiceTag } from "../services/typescript-compiler-effect.js";
import { makeTypeScriptCompilerServiceLayer } from "../services/typescript-compiler-effect.js";
import {
	isValidImportIdentifier,
	tryValidationWithFallback,
} from "./validation-helpers.js";

export type ModuleSpecifier =
	| TSESTree.ImportSpecifier
	| TSESTree.ExportSpecifier;

export interface TypeScriptServiceLayerContext {
	readonly layer: Layer.Layer<TypeScriptCompilerServiceTag>;
	readonly hasTypeScript: boolean;
}

interface ValidateModuleSpecifierParams<TResult> {
	readonly importedNode: TSESTree.Node | undefined;
	readonly specifier: ModuleSpecifier;
	readonly modulePath: string;
	readonly config: ImportValidationConfig<TResult>;
	readonly context: RuleContext<string, readonly string[]>;
	readonly tsService: TypeScriptServiceLayerContext;
}

/**
 * Base configuration for import validation rules
 *
 * @purity SHELL
 */
export interface ImportValidationConfig<TResult> {
	readonly validateSpecifier: (
		specifier: ModuleSpecifier,
		importName: string,
		modulePath: string,
		containingFilePath: string,
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
	) => Effect.Effect<TResult>;
	readonly formatMessage: (result: TResult) => string;
	readonly messageId: string;
	readonly skipWhenTypeScriptAvailable?: boolean;
}

const validateModuleSpecifier = <TResult>({
	importedNode,
	specifier,
	modulePath,
	config,
	context,
	tsService,
}: ValidateModuleSpecifierParams<TResult>): void => {
	if (!importedNode) return;

	if (!isValidImportIdentifier(importedNode)) {
		return;
	}

	const imported = importedNode;

	executeImportValidation({
		imported,
		specifier,
		modulePath,
		config,
		context,
		containingFilePath: context.filename || "",
		tsService,
	});
};

const makeSpecifierValidator =
	<TSpecifier extends ModuleSpecifier>(
		getImportedNode: (specifier: TSpecifier) => TSESTree.Node | undefined,
	) =>
	<TResult>(
		specifier: TSpecifier,
		modulePath: string,
		config: ImportValidationConfig<TResult>,
		context: RuleContext<string, readonly string[]>,
		tsService: TypeScriptServiceLayerContext,
	): void => {
		validateModuleSpecifier({
			importedNode: getImportedNode(specifier),
			specifier,
			modulePath,
			config,
			context,
			tsService,
		});
	};

/**
 * Validates import specifier using TypeScript service with filesystem fallback
 *
 * @purity SHELL
 * @effect ESLint reporting, Effect execution
 * @complexity O(1) for validation, O(n) for suggestions where n = number of exports
 * @throws Never
 */
export const validateImportSpecifierBase =
	makeSpecifierValidator<TSESTree.ImportSpecifier>(
		(specifier) => specifier.imported,
	);

/**
 * Validates export specifier in re-export statements using shared logic
 *
 * @purity SHELL
 */
export const validateExportSpecifierBase =
	makeSpecifierValidator<TSESTree.ExportSpecifier>(
		(specifier) => specifier.local,
	);

/**
 * Executes import validation with TypeScript service and fallback
 */
const executeImportValidation = <TResult>(params: {
	imported: TSESTree.Identifier;
	specifier: ModuleSpecifier;
	modulePath: string;
	config: ImportValidationConfig<TResult>;
	context: RuleContext<string, readonly string[]>;
	containingFilePath: string;
	tsService: TypeScriptServiceLayerContext;
}): void => {
	const {
		imported,
		specifier,
		modulePath,
		config,
		context,
		containingFilePath,
		tsService,
	} = params;
	const importName = imported.name;

	if (config.skipWhenTypeScriptAvailable === true && tsService.hasTypeScript) {
		return;
	}

	const { layer } = tsService;
	const validationEffect = Effect.provide(
		config.validateSpecifier(
			specifier,
			importName,
			modulePath,
			containingFilePath,
		),
		layer,
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

export const createTypeScriptServiceLayerForContext = (
	context: RuleContext<string, readonly string[]>,
): TypeScriptServiceLayerContext => {
	try {
		const parserServices = ESLintUtils.getParserServices(context, false);
		const program = parserServices.program;
		const checker = program.getTypeChecker();
		return {
			layer: makeTypeScriptCompilerServiceLayer(checker, program),
			hasTypeScript: true,
		};
	} catch {
		return {
			layer: makeTypeScriptCompilerServiceLayer(undefined, undefined),
			hasTypeScript: false,
		};
	}
};
