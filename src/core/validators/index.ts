// CHANGE: Validators module exports
// WHY: Single entry point for all validation predicates
// PURITY: CORE

export {
	extractModuleName,
	extractPropertyName,
	isModulePath,
	isTypeOnlyImport,
	shouldSkipIdentifier,
	shouldSkipMemberExpression,
} from "./node-predicates.js";
