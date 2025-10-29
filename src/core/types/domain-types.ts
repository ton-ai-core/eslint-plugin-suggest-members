// CHANGE: Доменные типы с брендированием для type safety
// WHY: Математическая строгость через систему типов
// PURITY: CORE
// REF: CLAUDE.md - строгая типизация без any/unknown

/**
 * Similarity score bounded in mathematical range [0, 1]
 *
 * @pure true
 * @purity CORE
 * @invariant 0 ≤ value ≤ 1
 *
 * FORMAT THEOREM: SimilarityScore ∈ [0, 1] ⊂ ℝ
 */
export type SimilarityScore = number & { readonly __brand: "SimilarityScore" };

/**
 * Creates validated similarity score
 *
 * @pure true
 * @purity CORE
 * @invariant Output is clamped to [0, 1]
 * @complexity O(1)
 * @throws Never
 */
export const makeSimilarityScore = (value: number): SimilarityScore => {
	const clamped = value < 0 ? 0 : value > 1 ? 1 : value;
	return clamped as SimilarityScore;
};

/**
 * Normalized string (lowercase, no separators)
 *
 * @pure true
 * @purity CORE
 * @invariant /^[a-z0-9]*$/.test(value)
 */
export type NormalizedString = string & {
	readonly __brand: "NormalizedString";
};

/**
 * Token from identifier splitting
 *
 * @pure true
 * @purity CORE
 * @invariant length > 0 ∧ value === value.toLowerCase()
 */
export type Token = string & { readonly __brand: "Token" };

/**
 * Suggestion with similarity score
 *
 * @pure true
 * @purity CORE
 * @invariant score ∈ [0, 1]
 */
export interface SuggestionWithScore {
	readonly name: string;
	readonly score: SimilarityScore;
}

/**
 * Minimum score threshold
 *
 * @pure true
 * @purity CORE
 */
export const MIN_SIMILARITY_SCORE: SimilarityScore = makeSimilarityScore(0.3);

/**
 * Maximum number of suggestions to return
 *
 * @pure true
 * @purity CORE
 */
export const MAX_SUGGESTIONS = 5;

// Note: Validation result constructors are exported from validation-types.js
