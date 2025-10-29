// CHANGE: Core suggestion engine with pure algorithms
// WHY: Mathematical functions for similarity scoring and ranking
// PURITY: CORE
// REF: system-promt.md - чистые функции без эффектов

import { compositeScore } from "../similarity/index.js";
import type { SuggestionWithScore } from "../types/domain-types.js";
import {
	MAX_SUGGESTIONS,
	MIN_SIMILARITY_SCORE,
} from "../types/domain-types.js";

/**
 * Filters and ranks candidates by similarity
 *
 * @param userInput - User's typed string
 * @param candidates - Available candidates
 * @returns Top suggestions sorted by score
 *
 * @pure true
 * @purity CORE (pure function, no effects)
 * @effect None
 * @invariant result.length ≤ MAX_SUGGESTIONS
 * @invariant ∀i < result.length-1: result[i].score ≥ result[i+1].score
 * @invariant ∀x ∈ result: x.score ≥ MIN_SIMILARITY_SCORE
 * @complexity O(n log n) where n = |candidates|
 * @throws Never
 *
 * FORMAT THEOREM: findSimilar: String × String[] → SuggestionWithScore[]
 *                 where |result| ≤ 5 ∧ sorted_descending(result.scores)
 */
export function findSimilarCandidates(
	userInput: string,
	candidates: readonly string[],
): readonly SuggestionWithScore[] {
	// CHANGE: Map candidates to scored suggestions
	// WHY: Need scores for filtering and sorting
	const scored = candidates.map((name) => ({
		name,
		score: compositeScore(userInput, name),
	}));

	// CHANGE: Filter by minimum score threshold
	// WHY: Remove low-quality suggestions
	// INVARIANT: ∀x ∈ filtered: x.score ≥ MIN_SIMILARITY_SCORE
	const filtered = scored.filter((item) => item.score >= MIN_SIMILARITY_SCORE);

	// CHANGE: Sort descending by score
	// WHY: Best suggestions first
	// INVARIANT: ∀i < sorted.length-1: sorted[i].score ≥ sorted[i+1].score
	const sorted = filtered.sort((a, b) => b.score - a.score);

	// CHANGE: Limit to maximum suggestions
	// WHY: Avoid overwhelming user with too many options
	// INVARIANT: result.length ≤ MAX_SUGGESTIONS
	return sorted.slice(0, MAX_SUGGESTIONS);
}
