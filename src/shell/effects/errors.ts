// CHANGE: Typed error definitions for Effect-based services
// WHY: Type-safe error handling without exceptions
// PURITY: SHELL
// REF: CLAUDE.md - typed errors in Effect signatures

/**
 * TypeScript Compiler API service errors
 *
 * @purity SHELL
 * @effect Error type definitions
 */
export type TypeScriptServiceError =
	| { readonly _tag: "SymbolNotFoundError"; readonly symbolName: string }
	| { readonly _tag: "TypeNotFoundError"; readonly nodeName: string }
	| { readonly _tag: "ModuleNotFoundError"; readonly modulePath: string }
	| { readonly _tag: "TypeResolutionError"; readonly message: string }
	| { readonly _tag: "InvalidNodeError"; readonly nodeKind: number }
	| { readonly _tag: "CheckerNotAvailableError" };

/**
 * Creates SymbolNotFoundError
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const makeSymbolNotFoundError = (
	symbolName: string,
): TypeScriptServiceError => ({
	_tag: "SymbolNotFoundError",
	symbolName,
});

/**
 * Creates TypeNotFoundError
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const makeTypeNotFoundError = (
	nodeName: string,
): TypeScriptServiceError => ({
	_tag: "TypeNotFoundError",
	nodeName,
});

/**
 * Creates ModuleNotFoundError
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const makeModuleNotFoundError = (
	modulePath: string,
): TypeScriptServiceError => ({
	_tag: "ModuleNotFoundError",
	modulePath,
});

/**
 * Creates TypeResolutionError
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const makeTypeResolutionError = (
	message: string,
): TypeScriptServiceError => ({
	_tag: "TypeResolutionError",
	message,
});

/**
 * Creates InvalidNodeError
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const makeInvalidNodeError = (
	nodeKind: number,
): TypeScriptServiceError => ({
	_tag: "InvalidNodeError",
	nodeKind,
});

/**
 * Creates CheckerNotAvailableError
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const makeCheckerNotAvailableError = (): TypeScriptServiceError => ({
	_tag: "CheckerNotAvailableError",
});

/**
 * Filesystem service errors
 *
 * @purity SHELL
 * @effect Error type definitions
 */
export type FilesystemError =
	| { readonly _tag: "FileNotFoundError"; readonly path: string }
	| { readonly _tag: "DirectoryNotFoundError"; readonly path: string }
	| {
			readonly _tag: "ReadError";
			readonly path: string;
			readonly message: string;
	  }
	| { readonly _tag: "PermissionError"; readonly path: string };

/**
 * Creates FileNotFoundError
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const makeFileNotFoundError = (path: string): FilesystemError => ({
	_tag: "FileNotFoundError",
	path,
});

/**
 * Creates DirectoryNotFoundError
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const makeDirectoryNotFoundError = (path: string): FilesystemError => ({
	_tag: "DirectoryNotFoundError",
	path,
});

/**
 * Creates ReadError
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const makeReadError = (
	path: string,
	message: string,
): FilesystemError => ({
	_tag: "ReadError",
	path,
	message,
});

/**
 * Creates PermissionError
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const makePermissionError = (path: string): FilesystemError => ({
	_tag: "PermissionError",
	path,
});
