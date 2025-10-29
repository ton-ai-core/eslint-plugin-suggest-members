// CHANGE: Lookup effects exports
// WHY: Single entry point for all lookup effects
// PURITY: SHELL (Effect composition)

export {
	exportExists,
	hasExports,
	validateNamedImport,
} from "./import-lookup.js";
export {
	getPropertyNames,
	hasProperties,
	validateMemberAccess,
} from "./member-lookup.js";
export {
	calculateMinScore,
	findSimilarModulePaths,
	modulePathExists,
	validateModulePath,
} from "./module-lookup.js";
