// CHANGE: Effect-based filesystem service
// WHY: Type-safe filesystem operations
// PURITY: SHELL
// REF: CLAUDE.md - Effect-based I/O

import * as fs from "node:fs";
import * as path from "node:path";
import { Effect } from "effect";
import type { FilesystemError } from "../effects/index.js";
import {
	makeDirectoryNotFoundError,
	makeFileNotFoundError,
	makeReadError,
} from "../effects/index.js";

/**
 * Filesystem service interface
 *
 * @purity SHELL
 * @effect Filesystem I/O
 */
export interface FilesystemService {
	/**
	 * Checks if file exists
	 *
	 * @purity SHELL
	 * @effect Filesystem read
	 * @complexity O(1)
	 */
	readonly fileExists: (
		filePath: string,
	) => Effect.Effect<boolean, FilesystemError>;

	/**
	 * Reads directory contents
	 *
	 * @purity SHELL
	 * @effect Filesystem read
	 * @complexity O(n) where n = number of files
	 */
	readonly readDirectory: (
		dirPath: string,
	) => Effect.Effect<readonly string[], FilesystemError>;

	/**
	 * Finds files matching pattern
	 *
	 * @purity SHELL
	 * @effect Filesystem read
	 * @complexity O(n) where n = number of files
	 */
	readonly findFiles: (
		dirPath: string,
		pattern: RegExp,
	) => Effect.Effect<readonly string[], FilesystemError>;

	/**
	 * Resolves module path
	 *
	 * @purity SHELL
	 * @effect Filesystem read
	 * @complexity O(1)
	 */
	readonly resolveModulePath: (
		fromPath: string,
		modulePath: string,
	) => Effect.Effect<string, FilesystemError>;
}

/**
 * File existence check effect
 *
 * @purity SHELL
 * @complexity O(1)
 */
const createFileExistsEffect = (
	filePath: string,
): Effect.Effect<boolean, FilesystemError> =>
	Effect.try({
		try: () => fs.existsSync(filePath),
		catch: (error) =>
			makeReadError(
				filePath,
				error instanceof Error ? error.message : String(error),
			),
	});

/**
 * Directory reading effect
 *
 * @purity SHELL
 * @complexity O(n)
 */
const createReadDirectoryEffect = (
	dirPath: string,
): Effect.Effect<readonly string[], FilesystemError> =>
	Effect.try({
		try: () => {
			if (!fs.existsSync(dirPath)) {
				const error = makeDirectoryNotFoundError(dirPath);
				throw new Error(`Directory not found: ${error.path}`);
			}
			return fs.readdirSync(dirPath);
		},
		catch: (error) => {
			if (
				typeof error === "object" &&
				error !== null &&
				"_tag" in error &&
				error._tag === "DirectoryNotFoundError"
			) {
				return error as FilesystemError;
			}
			return makeReadError(
				dirPath,
				error instanceof Error ? error.message : String(error),
			);
		},
	});

/**
 * File pattern matching effect
 *
 * @purity SHELL
 * @complexity O(n)
 */
const createFindFilesEffect =
	(
		readDirectory: (
			dirPath: string,
		) => Effect.Effect<readonly string[], FilesystemError>,
	) =>
	(
		dirPath: string,
		pattern: RegExp,
	): Effect.Effect<readonly string[], FilesystemError> =>
		Effect.gen(function* (_) {
			const files = yield* _(readDirectory(dirPath));
			return files.filter((file) => pattern.test(file));
		});

/**
 * Module path resolution with extensions
 *
 * @purity SHELL
 * @complexity O(1)
 */
const tryResolveWithExtensions = (resolved: string): string | null => {
	const extensions = [".ts", ".tsx", ".d.ts", ".js", ".jsx", ""];

	// Try direct files
	for (const ext of extensions) {
		const fullPath = resolved + ext;
		if (fs.existsSync(fullPath)) {
			return fullPath;
		}
	}

	// Try index files
	for (const ext of extensions) {
		const indexPath = path.join(resolved, `index${ext}`);
		if (fs.existsSync(indexPath)) {
			return indexPath;
		}
	}

	return null;
};

/**
 * Module path resolution effect
 *
 * @purity SHELL
 * @complexity O(1)
 */
const createResolveModulePathEffect = (
	fromPath: string,
	modulePath: string,
): Effect.Effect<string, FilesystemError> =>
	Effect.try({
		try: () => {
			if (modulePath.startsWith("./") || modulePath.startsWith("../")) {
				const resolved = path.resolve(path.dirname(fromPath), modulePath);
				const result = tryResolveWithExtensions(resolved);

				if (result !== null) {
					return result;
				}

				const error = makeFileNotFoundError(modulePath);
				throw new Error(`File not found: ${error.path}`);
			}

			return modulePath;
		},
		catch: (error) => {
			if (
				typeof error === "object" &&
				error !== null &&
				"_tag" in error &&
				error._tag === "FileNotFoundError"
			) {
				return error as FilesystemError;
			}
			return makeReadError(
				modulePath,
				error instanceof Error ? error.message : String(error),
			);
		},
	});

/**
 * Creates filesystem service implementation
 *
 * @returns Filesystem service
 *
 * @purity SHELL
 * @effect Service factory
 * @complexity O(1)
 */
export const makeFilesystemService = (): FilesystemService => ({
	fileExists: createFileExistsEffect,
	readDirectory: createReadDirectoryEffect,
	findFiles: createFindFilesEffect(createReadDirectoryEffect),
	resolveModulePath: createResolveModulePathEffect,
});
