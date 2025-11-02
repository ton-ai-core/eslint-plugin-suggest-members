// CHANGE: ESLint rule for suggesting similar imports
// WHY: Help users find correct export names
// PURITY: INFRASTRUCTURE (ESLint integration)
// REF: FUNCTIONAL_ARCHITECTURE.md - RULES layer

import { createValidationRule } from "../../shell/shared/import-validation-base.js";
import {
	formatImportValidationMessage,
	validateImportSpecifierEffect,
} from "../../shell/validation/import-validation-effect.js";

/**
 * ESLint rule: suggest-imports
 *
 * Suggests similar export names when importing non-existent members
 *
 * @purity SHELL
 * @effect ESLint reporting, TypeScript Compiler API
 */
export const suggestImportsRule = createValidationRule(
	"suggest-imports",
	"Suggest similar export names when importing non-existent members",
	"suggestImports",
	{
		validateSpecifier: validateImportSpecifierEffect,
		formatMessage: formatImportValidationMessage,
		messageId: "suggestImports",
	},
);
