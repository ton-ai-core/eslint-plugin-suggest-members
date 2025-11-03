// CHANGE: ESLint rule for suggesting similar export names
// WHY: Help users find correct export names when importing non-existent exports
// PURITY: SHELL (ESLint integration)
// REF: FUNCTIONAL_ARCHITECTURE.md - RULES layer
// INVARIANT: ∀ import: ¬exists(export) → suggest(similar_exports)

import { createExportValidationRule } from "../../shell/shared/import-validation-rule-factory.js";
import {
	formatExportValidationMessage,
	validateExportAccessEffect,
} from "../../shell/validation/export-validation-effect.js";
import { createFilesystemExportValidationEffect } from "../../shell/validation/filesystem-export-validation-effect.js";

/**
 * ESLint rule: suggest-exports
 *
 * Suggests similar export names when importing non-existent exports
 *
 * @purity SHELL
 * @effect ESLint reporting, TypeScript Compiler API
 * @invariant ∀ import: validate(import) → Valid | ExportNotFound
 * @complexity O(n log n) where n = |available_exports|
 */
export const suggestExportsRule = createExportValidationRule(
	"suggest-exports",
	"Suggest similar export names when importing non-existent exports",
	"suggestExports",
	{
		validateSpecifier: validateExportAccessEffect,
		fallbackValidationEffect: createFilesystemExportValidationEffect,
		formatMessage: formatExportValidationMessage,
		messageId: "suggestExports",
	},
);
