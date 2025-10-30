// CHANGE: CORE layer public API
// WHY: Single entry point for all pure functions
// PURITY: CORE
// REF: FUNCTIONAL_ARCHITECTURE.md - CORE layer architecture

// Effect-based pure computations
export {
	findSimilarCandidatesEffect,
	formatSuggestionMessageEffect,
	isValidCandidateEffect,
} from "./effects/index.js";
// Message formatting
export {
	formatImportMessage,
	formatMemberMessage,
	formatModuleMessage,
	formatSuggestionMessage,
} from "./formatting/messages.js";
// Metadata extraction
export {
	createPluginMeta,
	extractPackageMetadata,
	type PackageMetadata,
} from "./metadata/index.js";
// Similarity algorithms
export {
	compositeScore,
	containmentScore,
	hasSubstringMatch,
	jaccardSimilarity,
	jaro,
	jaroWinkler,
	lengthPenalty,
	longestCommonPrefix,
	normalize,
	prefixScore,
	splitIdentifier,
} from "./similarity/index.js";
// Suggestion engine
export { findSimilarCandidates } from "./suggestion/engine.js";
// Types
export type {
	ExportValidationResult,
	ImportValidationResult,
	MemberValidationResult,
	ModulePathValidationResult,
	NormalizedString,
	SimilarityScore,
	SuggestionWithScore,
	Token,
} from "./types/index.js";
export {
	MAX_SUGGESTIONS,
	MIN_SIMILARITY_SCORE,
	makeExportNotFoundResult,
	makeImportNotFoundResult,
	makeInvalidMemberResult,
	makeModuleNotFoundResult,
	makeSimilarityScore,
	makeValidExportResult,
	makeValidImportResult,
	makeValidMemberResult,
	makeValidModuleResult,
	makeValidResult,
} from "./types/index.js";
// Validation
// Validation utilities
export {
	getMinimumSimilarityScore,
	isValidCandidate,
	SUPPORTED_EXTENSIONS,
} from "./validation/candidates.js";
// Validators
export {
	extractModuleName,
	extractPropertyName,
	isModulePath,
	isTypeOnlyImport,
	shouldSkipIdentifier,
	shouldSkipMemberExpression,
} from "./validators/index.js";
