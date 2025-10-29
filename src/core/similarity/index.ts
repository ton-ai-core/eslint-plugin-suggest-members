// CHANGE: Similarity module exports
// WHY: Single entry point for all similarity algorithms
// PURITY: CORE

// CHANGE: Export constants from domain-types
// WHY: Centralized access to similarity configuration
// PURITY: CORE
export {
	MAX_SUGGESTIONS,
	MIN_SIMILARITY_SCORE,
} from "../types/domain-types.js";
export {
	compositeScore,
	containmentScore,
	jaccardSimilarity,
	lengthPenalty,
	prefixScore,
} from "./composite.js";
export {
	hasSubstringMatch,
	longestCommonPrefix,
	normalize,
	splitIdentifier,
} from "./helpers.js";
export { jaro } from "./jaro.js";
export { jaroWinkler } from "./jaro-winkler.js";
