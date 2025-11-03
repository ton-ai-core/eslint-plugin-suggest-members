/**
 * Filesystem-based export validation effect
 * CHANGE: Create filesystem fallback for export validation
 * WHY: TypeScript service may fail in ESLint context
 * PURITY: SHELL - filesystem operations with side effects
 */

import { Effect } from "effect";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";

import type { ExportValidationResult } from "../../core/types/validation-types.js";
import {
	makeExportNotFoundResult,
	makeValidExportResult,
} from "../../core/types/validation-types.js";
import { createSuggestionsWithScore } from "../../core/utils/suggestions.js";
import type { FilesystemService } from "../services/filesystem.js";
import { parseExportsFromContent } from "./export-parser.js";

/**
 * Creates filesystem-based export validation effect
 * @param filesystemService - Filesystem service for file operations
 * @returns Effect that validates exports using filesystem
 * @complexity O(1) - single file read operation
 * @purity SHELL - reads files from filesystem
 */
export const createFilesystemExportValidationEffect =
	(filesystemService: FilesystemService) =>
	(
		importName: string,
		modulePath: string,
		contextFilePath: string,
	): Effect.Effect<ExportValidationResult, never, never> =>
		Effect.succeed(
			validateExportInModule(
				importName,
				modulePath,
				contextFilePath,
				filesystemService,
			),
		);

// CHANGE: Remove unused function - using parseExportsFromContent directly
// WHY: Avoid code duplication

/**
 * Validates export in a specific module
 * @param importName - Name to validate
 * @param modulePath - Module path
 * @param contextFilePath - Context file path
 * @param filesystemService - Filesystem service
 * @returns Validation result
 * @purity SHELL - filesystem operations
 */
const validateExportInModule = (
	importName: string,
	modulePath: string,
	contextFilePath: string,
	_filesystemService: FilesystemService,
): ExportValidationResult => {
	try {
		// CHANGE: Only validate local modules (relative paths)
		// WHY: This fallback is only for local modules
		if (!modulePath.startsWith("./") && !modulePath.startsWith("../")) {
			return makeValidExportResult();
		}

		// CHANGE: Resolve module path relative to context file
		// WHY: Need absolute path for filesystem operations
		const contextDir = dirname(contextFilePath);
		const resolvedPath = resolve(contextDir, modulePath);

		// CHANGE: Try different extensions
		// WHY: Module path may not include extension
		const possiblePaths = [
			resolvedPath,
			resolvedPath + ".ts",
			resolvedPath + ".js",
			resolvedPath + "/index.ts",
			resolvedPath + "/index.js",
		];

		return validateInPossiblePaths(importName, modulePath, possiblePaths);
	} catch {
		// CHANGE: Return valid on any error
		// WHY: Don't break linting if validation fails
		return makeValidExportResult();
	}
};

/**
 * Validates export in possible file paths
 */
const validateInPossiblePaths = (
	importName: string,
	modulePath: string,
	possiblePaths: string[],
): ExportValidationResult => {
	for (const filePath of possiblePaths) {
		try {
			// CHANGE: Read file content and extract exports
			// WHY: Need to check what the module actually exports
			const content = readFileSync(filePath, "utf-8");
			const { exported, locals } = parseExportsFromContent(content);

			// CHANGE: Check if export name is declared locally
			// WHY: Distinguish alias typos from valid exports
			const hasLocalDeclaration = locals.includes(importName);
			if (exported.includes(importName) && hasLocalDeclaration) {
				return makeValidExportResult();
			}

			const candidatePool = [...new Set([...exported, ...locals])];
			const filteredCandidates = candidatePool.filter((candidate) => {
				if (candidate.length === 0) return false;
				if (candidate === importName) return false;
				if (candidate.startsWith("_")) return false;
				if (candidate.startsWith("__")) return false;
				if (candidate === "default") return false;
				return true;
			});

			// CHANGE: Find similar export names
			// WHY: Provide helpful suggestions
			const suggestionsWithScore = createSuggestionsWithScore(
				importName,
				filteredCandidates,
			);
			if (suggestionsWithScore.length > 0) {
				return makeExportNotFoundResult(
					importName,
					modulePath,
					suggestionsWithScore,
					{},
				);
			}

			// CHANGE: Return not found without suggestions
			// WHY: Export doesn't exist and no similar names found
			return makeExportNotFoundResult(importName, modulePath, [], {});
		} catch {
			// CHANGE: Continue to next path on read error
			// WHY: File might exist but be unreadable
			continue;
		}
	}

	// CHANGE: Return valid if no file found
	// WHY: Don't report errors for missing files (might be external modules)
	return makeValidExportResult();
};
