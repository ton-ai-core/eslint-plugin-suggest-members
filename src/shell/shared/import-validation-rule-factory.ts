import { dirname, extname, relative } from "node:path";
import type { TSESTree } from "@typescript-eslint/utils";
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type {
	RuleContext,
	RuleListener,
	RuleModule,
} from "@typescript-eslint/utils/ts-eslint";
import { isTypeOnlyImport } from "../../core/validators/index.js";
import type {
	ImportValidationConfig,
	ModuleSpecifier,
	TypeScriptServiceLayerContext,
} from "./import-validation-base.js";
import {
	createTypeScriptServiceLayerForContext,
	validateExportSpecifierBase,
	validateImportSpecifierBase,
} from "./import-validation-base.js";

interface SpecifierDescriptor<
	TNode extends ModuleSpecifier,
	TDeclaration extends { readonly specifiers: readonly TSESTree.Node[] },
> {
	readonly eventName: "ImportDeclaration" | "ExportNamedDeclaration";
	readonly getModulePath: (node: TDeclaration) => string | undefined;
	readonly shouldSkipNode?: (node: TDeclaration) => boolean;
	readonly specifierType: AST_NODE_TYPES;
	readonly validateSpecifier: <TResult>(
		specifier: TNode,
		modulePath: string,
		config: ImportValidationConfig<TResult>,
		context: RuleContext<string, readonly string[]>,
		tsService: TypeScriptServiceLayerContext,
	) => void;
}

const makeListenerBuilder =
	<
		TNode extends ModuleSpecifier,
		TDeclaration extends { readonly specifiers: readonly TSESTree.Node[] },
	>(
		descriptor: SpecifierDescriptor<TNode, TDeclaration>,
	) =>
	<TResult>(
		context: RuleContext<string, readonly string[]>,
		config: ImportValidationConfig<TResult>,
	): RuleListener => {
		const tsService = createTypeScriptServiceLayerForContext(context);
		const {
			eventName,
			getModulePath,
			shouldSkipNode,
			specifierType,
			validateSpecifier,
		} = descriptor;

		const listener: Partial<RuleListener> = {
			[eventName](node: TDeclaration): void {
				if (shouldSkipNode?.(node) === true) return;

				const modulePath = normalizeModuleSpecifier(
					getModulePath(node),
					context.filename,
				);
				if (modulePath === undefined) return;

				for (const specifier of node.specifiers) {
					if (specifier.type === specifierType) {
						validateSpecifier(
							specifier as TNode,
							modulePath,
							config,
							context,
							tsService,
						);
					}
				}
			},
		};

		return listener as RuleListener;
	};

const buildImportListeners = makeListenerBuilder<
	TSESTree.ImportSpecifier,
	TSESTree.ImportDeclaration
>({
	eventName: "ImportDeclaration",
	getModulePath: (node) =>
		typeof node.source.value === "string" ? node.source.value : undefined,
	shouldSkipNode: (node) => isTypeOnlyImport(node),
	specifierType: AST_NODE_TYPES.ImportSpecifier,
	validateSpecifier: (specifier, modulePath, config, context, tsService) => {
		validateImportSpecifierBase(
			specifier,
			modulePath,
			config,
			context,
			tsService,
		);
	},
});

const buildExportListeners = makeListenerBuilder<
	TSESTree.ExportSpecifier,
	TSESTree.ExportNamedDeclaration
>({
	eventName: "ExportNamedDeclaration",
	getModulePath: (node) =>
		typeof node.source?.value === "string" ? node.source.value : undefined,
	specifierType: AST_NODE_TYPES.ExportSpecifier,
	validateSpecifier: (specifier, modulePath, config, context, tsService) => {
		validateExportSpecifierBase(
			specifier,
			modulePath,
			config,
			context,
			tsService,
		);
	},
});

const createRule = <TResult>(
	description: string,
	messageId: string,
	config: ImportValidationConfig<TResult>,
	buildListener: (
		context: RuleContext<string, readonly string[]>,
		config: ImportValidationConfig<TResult>,
	) => RuleListener,
): RuleModule<string, readonly string[]> =>
	ESLintUtils.RuleCreator.withoutDocs({
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
			return buildListener(context, config);
		},
	});

const makeValidationRule =
	<TResult>(
		listenerBuilder: (
			context: RuleContext<string, readonly string[]>,
			config: ImportValidationConfig<TResult>,
		) => RuleListener,
	) =>
	(
		_ruleName: string,
		description: string,
		messageId: string,
		config: ImportValidationConfig<TResult>,
	): RuleModule<string, readonly string[]> =>
		createRule(description, messageId, config, listenerBuilder);

export const createValidationRule = makeValidationRule(buildImportListeners);
export const createExportValidationRule =
	makeValidationRule(buildExportListeners);

const normalizeModuleSpecifier = (
	modulePath: string | undefined,
	contextFilePath: string | undefined,
): string | undefined => {
	if (modulePath !== undefined) {
		return modulePath;
	}

	if (contextFilePath === undefined || contextFilePath.length === 0) {
		return undefined;
	}

	const directory = dirname(contextFilePath);
	const rawRelative = relative(directory, contextFilePath).replace(/\\/g, "/");
	const extension = extname(rawRelative);
	let withoutExtension =
		extension.length > 0
			? rawRelative.slice(0, -extension.length)
			: rawRelative;

	if (
		!withoutExtension.startsWith("./") &&
		!withoutExtension.startsWith("../")
	) {
		withoutExtension = `./${withoutExtension}`;
	}

	return withoutExtension;
};
