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
const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".json"] as const;

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
): Effect.Effect<readonly SuggestionWithScore[], FilesystemError> =>
	Effect.gen(function* (_) {
		const dirPath = path.dirname(resolvedPath);
		const files = yield* _(fsService.readDirectory(dirPath));

		const tsFiles = files.filter((file: string) =>
			/\.(ts|tsx|js|jsx|json)$/.test(file),
		);

		const moduleNames = tsFiles.map((file: string) =>
			file.replace(/\.(ts|tsx|js|jsx|json)$/, ""),
		);

		const validCandidates = moduleNames.filter((candidate: string) =>
			isValidModuleCandidate(candidate, path.basename(requestedPath)),
		);

		return yield* _(
			findSimilarCandidatesEffect(
				path.basename(requestedPath),
				validCandidates,
			),
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

			const pathExists = yield* _(fsService.fileExists(resolvedPath));
			if (pathExists) {
				return makeValidModuleResult();
			}

			const existsWithExt = yield* _(
				checkPathWithExtensions(fsService, resolvedPath),
			);
			if (existsWithExt) {
				return makeValidModuleResult();
			}

			const hasIndexFiles = yield* _(checkIndexFiles(fsService, resolvedPath));
			if (hasIndexFiles) {
				return makeValidModuleResult();
			}

			const suggestions = yield* _(
				generateModuleSuggestions(fsService, resolvedPath, requestedPath),
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
	// Skip hidden files
	if (candidate.startsWith(".")) return false;

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
