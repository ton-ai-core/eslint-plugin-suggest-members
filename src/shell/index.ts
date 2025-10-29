// CHANGE: SHELL layer public API
// WHY: Single entry point for all Effect-based services, validation, and lookup
// PURITY: SHELL (all effects)
// REF: FUNCTIONAL_ARCHITECTURE.md - SHELL layer architecture

// Effects and Services
export type {
	FilesystemError,
	TypeScriptServiceError,
} from "./effects/index.js";
export {
	makeCheckerNotAvailableError,
	makeDirectoryNotFoundError,
	makeFileNotFoundError,
	makeInvalidNodeError,
	makeModuleNotFoundError,
	makePermissionError,
	makeReadError,
	makeSymbolNotFoundError,
	makeTypeNotFoundError,
	makeTypeResolutionError,
} from "./effects/index.js";
// Lookup Effects
export {
	calculateMinScore,
	exportExists,
	findSimilarModulePaths,
	getPropertyNames,
	hasExports,
	hasProperties,
	modulePathExists,
	validateMemberAccess,
	validateModulePath,
	validateNamedImport,
} from "./lookup/index.js";
export type {
	FilesystemService,
	TypeScriptCompilerService,
} from "./services/index.js";
export {
	makeFilesystemService,
	makeTypeScriptCompilerService,
} from "./services/index.js";
// Validation Effects
export {
	formatImportValidationMessage,
	formatMemberValidationMessage,
	formatModulePathValidationMessage,
	validateMemberAccessEffect,
	validateModulePathEffect,
} from "./validation/index.js";
