// CHANGE: Shared suggestion creation utilities
// WHY: Eliminate code duplication between validation modules
// PURITY: CORE (pure suggestion creation functions)

import type { SuggestionWithScore } from "../types/domain-types.js";
import { makeSimilarityScore } from "../types/domain-types.js";
import { calculateSimilarity, findSimilarNames } from "./similarity.js";

/**
 * Creates suggestions with scores for a target name
 * @param targetName - Name to find suggestions for
 * @param candidates - Available candidate names
 * @returns Array of suggestions with similarity scores
 * @complexity O(n*m) where n = candidates length, m = average string length
 * @purity PURE - no side effects
 */
export const createSuggestionsWithScore = (
	targetName: string,
	candidates: string[],
): SuggestionWithScore[] => {
	const suggestions = findSimilarNames(targetName, candidates);
	if (suggestions.length === 0) {
		return [];
	}

	return suggestions.map((name) => ({
		name,
		score: makeSimilarityScore(calculateSimilarity(targetName, name)),
	}));
};
