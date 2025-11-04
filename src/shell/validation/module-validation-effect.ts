// CHANGE: Effect-based module path validation with mathematical guarantees
// WHY: Pure functional composition separating CORE logic from SHELL effects
// PURITY: SHELL (CORE + SHELL composition)
// REF: system-promt.md - функциональная архитектура с Effect-TS

import * as path from "node:path";
import { Effect, pipe } from "effect";
import { match } from "ts-pattern";
import type {
	ModulePathValidationResult,
	SuggestionWithScore,
} from "../../core/index.js";
import {
	findSimilarCandidatesEffect,
	formatModuleMessage,
	isModulePath,
	makeModuleNotFoundResult,
	makeValidModuleResult,
} from "../../core/index.js";
import type { FilesystemError } from "../effects/errors.js";
import { FilesystemServiceTag } from "../services/filesystem-effect.js";
import {
	MODULE_FILE_EXTENSIONS,
	normalizeModuleSpecifier,
	stripKnownExtension,
} from "../shared/module-path-utils.js";

/**
 * Validates module path with Effect-based composition
 *
 * @param node - Import/require node
 * @param requestedPath - Module path being requested
 * @param containingFile - File containing the import
 * @returns Effect with validation result
 *
 * @purity SHELL
 * @effect Effect<ModulePathValidationResult, FilesystemError, FilesystemServiceTag>
 * @invariant Result is Valid | ModuleNotFound (exhaustive)
 * @complexity O(n log n) where n = |moduleFiles|
 * @throws Never - все ошибки типизированы в Effect
 *
 * FORMAT THEOREM: ∀node,path,file: validateModulePath(node,path,file) → Effect<ValidationResult>
 */
/**
 * Common extensions for TypeScript/JavaScript files
 *
 * @purity CORE
 */
// CHANGE: Align supported extensions with canonical module resolution list
// WHY: Ensure validator mirrors TypeScript extension substitution for `.js`-authored specifiers
// QUOTE(ТЗ): "не учитывая расширения файлов"
// REF: user-message-2025-10-25
// SOURCE: https://www.typescriptlang.org/docs/handbook/modules/reference.html#file-extension-substitution - "TypeScript can resolve to a .ts or .d.ts file even if the module specifier explicitly uses a .js file extension."
// FORMAT THEOREM: ∀e ∈ SUPPORTED_EXTENSIONS: resolvable(e) → validImport
// PURITY: CORE
// INVARIANT: SUPPORTED_EXTENSIONS === MODULE_FILE_EXTENSIONS (read-only)
// COMPLEXITY: O(1)
const SUPPORTED_EXTENSIONS = MODULE_FILE_EXTENSIONS;

/**
 * Generic file existence checker with extensions
 *
 * @purity SHELL
 * @complexity O(n) where n = |extensions|
 */
const checkFileExistsWithExtensions = (
	fsService: {
		fileExists: (path: string) => Effect.Effect<boolean, FilesystemError>;
	},
	pathGenerator: (ext: string) => string,
): Effect.Effect<boolean, FilesystemError> =>
	Effect.gen(function* (_) {
		for (const ext of SUPPORTED_EXTENSIONS) {
			const fullPath = pathGenerator(ext);
			const exists = yield* _(fsService.fileExists(fullPath));
			if (exists) return true;
		}
		return false;
	});

/**
 * Checks if path exists with extensions
 *
 * @purity SHELL
 * @complexity O(n) where n = |extensions|
 */
const checkPathWithExtensions = (
	fsService: {
		fileExists: (path: string) => Effect.Effect<boolean, FilesystemError>;
	},
	basePath: string,
): Effect.Effect<boolean, FilesystemError> =>
	checkFileExistsWithExtensions(fsService, (ext) => basePath + ext);

/**
 * Checks for index files in directory
 *
 * @purity SHELL
 * @complexity O(n) where n = |extensions|
 */
const checkIndexFiles = (
	fsService: {
		fileExists: (path: string) => Effect.Effect<boolean, FilesystemError>;
	},
	dirPath: string,
): Effect.Effect<boolean, FilesystemError> =>
	checkFileExistsWithExtensions(fsService, (ext) =>
		path.join(dirPath, `index${ext}`),
	);

/**
 * Generates module suggestions
 *
 * @purity SHELL
 * @complexity O(n log n) where n = |files|
 */
const generateModuleSuggestions = (
	fsService: {
		readDirectory: (
			path: string,
		) => Effect.Effect<readonly string[], FilesystemError>;
	},
	resolvedPath: string,
	requestedPath: string,
	containingFile: string,
): Effect.Effect<readonly SuggestionWithScore[], FilesystemError> =>
	Effect.gen(function* (_) {
		const targetDirectory = path.dirname(resolvedPath);
		const containingDir = path.dirname(containingFile);
		const normalizedRequested = requestedPath.replace(/\\/g, "/");
		const files = yield* _(fsService.readDirectory(targetDirectory));

		const tsFiles = files.filter((file: string) =>
			/\.(ts|tsx|js|jsx|json)$/.test(file),
		);

		const moduleNames = tsFiles.map((file: string) => {
			const absoluteCandidate = path.join(targetDirectory, file);
			const withoutExtension = stripKnownExtension(absoluteCandidate);
			return normalizeModuleSpecifier(containingDir, withoutExtension);
		});

		const uniqueCandidates = [...new Set(moduleNames)];
		const validCandidates = uniqueCandidates.filter((candidate: string) =>
			isValidModuleCandidate(candidate, normalizedRequested),
		);

		return yield* _(
			findSimilarCandidatesEffect(normalizedRequested, validCandidates),
		);
	});

export const validateModulePathEffect = (
	node: object, // ESLint ImportDeclaration | CallExpression
	requestedPath: string,
	containingFile: string,
): Effect.Effect<
	ModulePathValidationResult,
	FilesystemError,
	FilesystemServiceTag
> =>
	pipe(
		Effect.gen(function* (_) {
			if (!isModulePath(requestedPath)) {
				return makeValidModuleResult();
			}

			const fsService = yield* _(FilesystemServiceTag);
			const resolvedPath = yield* _(
				fsService.resolveRelativePath(containingFile, requestedPath),
			);
			const resolvedWithoutExtension = stripKnownExtension(resolvedPath);

			const pathExists = yield* _(fsService.fileExists(resolvedPath));
			if (pathExists) {
				return makeValidModuleResult();
			}

			const existsWithExt = yield* _(
				checkPathWithExtensions(fsService, resolvedWithoutExtension),
			);
			if (existsWithExt) {
				return makeValidModuleResult();
			}

			// CHANGE: Evaluate index candidates from extension-normalized base path
			// WHY: Avoid false negatives when `.js` specifiers map to `.ts` directories
			// QUOTE(ТЗ): "не учитывая расширения файлов"
			// REF: user-message-2025-10-25
			// SOURCE: https://www.typescriptlang.org/docs/handbook/modules/reference.html#file-extension-substitution - "TypeScript always wants to resolve internally to a file that can provide type information, while ensuring that the runtime or bundler can use the same path to resolve to a file that provides a JavaScript implementation."
			// FORMAT THEOREM: ∀p ∈ ModulePaths: dirExists(p) ∧ indexExists(p) → valid(p)
			// PURITY: SHELL
			// INVARIANT: resolvedWithoutExtension retains deterministic directory root
			// COMPLEXITY: O(|MODULE_FILE_EXTENSIONS|)
			const hasIndexFiles = yield* _(
				checkIndexFiles(fsService, resolvedWithoutExtension),
			);
			if (hasIndexFiles) {
				return makeValidModuleResult();
			}

			const suggestions = yield* _(
				generateModuleSuggestions(
					fsService,
					resolvedPath,
					requestedPath,
					containingFile,
				),
			);
			return makeModuleNotFoundResult(requestedPath, suggestions, node);
		}),
	);

/**
 * Checks if module path exists
 *
 * @param modulePath - Module path to check
 * @param containingFile - File containing the import
 * @returns Effect with boolean result
 *
 * @purity SHELL
 * @effect Effect<boolean, FilesystemError, FilesystemServiceTag>
 * @complexity O(1)
 * @throws Never
 */
export const modulePathExistsEffect = (
	modulePath: string,
	containingFile: string,
): Effect.Effect<boolean, never, FilesystemServiceTag> =>
	pipe(
		Effect.gen(function* (_) {
			const fsService = yield* _(FilesystemServiceTag);
			const resolvedPath = yield* _(
				fsService.resolveRelativePath(containingFile, modulePath),
			);
			return yield* _(fsService.fileExists(resolvedPath));
		}),
	);

/**
 * Validates if candidate is suitable for module path suggestions
 *
 * @param candidate - Module candidate
 * @param userInput - User's input
 * @returns true if candidate is valid
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(1)
 * @throws Never
 */
export const isValidModuleCandidate = (
	candidate: string,
	userInput: string,
): boolean => {
	// Skip hidden files (but allow relative imports)
	if (
		candidate.startsWith(".") &&
		!candidate.startsWith("./") &&
		!candidate.startsWith("../")
	) {
		return false;
	}

	// Skip exact matches
	if (candidate === userInput) return false;

	// Skip empty names
	if (candidate.length === 0) return false;

	// Skip test files
	if (candidate.includes(".test.") || candidate.includes(".spec.")) {
		return false;
	}

	return true;
};

/**
 * Formats module path validation result into user message
 *
 * @param result - Validation result
 * @returns Formatted message
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(n) where n = |suggestions|
 * @throws Never
 */
export const formatModulePathValidationMessage = (
	result: ModulePathValidationResult,
): string =>
	match(result)
		.with({ _tag: "Valid" }, () => "")
		.with({ _tag: "ModuleNotFound" }, (invalid) => {
			const { requestedPath, suggestions } = invalid;
			return formatModuleMessage(requestedPath, suggestions);
		})
		.exhaustive();
