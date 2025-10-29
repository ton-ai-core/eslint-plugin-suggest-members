// CHANGE: Effect-based Filesystem service with mathematical guarantees
// WHY: Pure functional composition with typed effects
// PURITY: SHELL
// REF: system-promt.md - Effect-TS монадическая композиция

import * as fs from "node:fs";
import * as path from "node:path";
import { Context, Effect, Layer, pipe } from "effect";
import type { FilesystemError } from "../effects/errors.js";
import {
	makeDirectoryNotFoundError,
	makePermissionError,
	makeReadError,
} from "../effects/errors.js";

/**
 * Filesystem service interface with Effect-based operations
 *
 * @purity SHELL
 * @effect All operations return Effect for explicit error handling
 */
export interface FilesystemService {
	readonly readDirectory: (
		dirPath: string,
	) => Effect.Effect<readonly string[], FilesystemError, never>;

	readonly fileExists: (
		filePath: string,
	) => Effect.Effect<boolean, never, never>;

	readonly resolveRelativePath: (
		from: string,
		to: string,
	) => Effect.Effect<string, never, never>;

	readonly getFileExtension: (
		filePath: string,
	) => Effect.Effect<string, never, never>;
}

/**
 * Filesystem service tag for dependency injection
 *
 * @purity SHELL
 */
export class FilesystemServiceTag extends Context.Tag("FilesystemService")<
	FilesystemServiceTag,
	FilesystemService
>() {}

/**
 * Creates Filesystem service implementation
 *
 * @returns Service implementation
 *
 * @purity SHELL
 * @effect Creates service with filesystem effects
 * @complexity O(1) for service creation
 * @throws Never - все ошибки типизированы в Effect
 */
export const makeFilesystemService = (): FilesystemService => ({
	readDirectory: (dirPath: string) =>
		pipe(
			Effect.sync(() => {
				try {
					if (!fs.existsSync(dirPath)) {
						return Effect.fail(makeDirectoryNotFoundError(dirPath));
					}

					const stats = fs.statSync(dirPath);
					if (!stats.isDirectory()) {
						return Effect.fail(makeDirectoryNotFoundError(dirPath));
					}

					const files = fs.readdirSync(dirPath);
					return Effect.succeed(files);
				} catch (error) {
					if (error instanceof Error) {
						if (error.message.includes("ENOENT")) {
							return Effect.fail(makeDirectoryNotFoundError(dirPath));
						}
						if (error.message.includes("EACCES")) {
							return Effect.fail(makePermissionError(dirPath));
						}
						return Effect.fail(makeReadError(dirPath, error.message));
					}
					return Effect.fail(makeReadError(dirPath, "Unknown error"));
				}
			}),
			Effect.flatten,
		),

	fileExists: (filePath: string) =>
		Effect.sync(() => {
			try {
				return fs.existsSync(filePath);
			} catch {
				return false;
			}
		}),

	resolveRelativePath: (from: string, to: string) =>
		Effect.succeed(path.resolve(path.dirname(from), to)),

	getFileExtension: (filePath: string) =>
		Effect.succeed(path.extname(filePath)),
});

/**
 * Creates Filesystem service layer
 *
 * @returns Service layer for dependency injection
 *
 * @purity SHELL
 * @effect Creates Layer for Effect composition
 * @complexity O(1)
 * @throws Never
 */
export const makeFilesystemServiceLayer = (): Layer.Layer<
	FilesystemServiceTag,
	never,
	never
> => Layer.succeed(FilesystemServiceTag, makeFilesystemService());
