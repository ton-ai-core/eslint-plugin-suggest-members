// CHANGE: Composite similarity score combining multiple algorithms
// WHY: Multi-dimensional matching for identifier similarity
// PURITY: CORE
// REF: FUNCTIONAL_ARCHITECTURE.md - composite score formula

import type { SimilarityScore } from "../types/index.js";
import { makeSimilarityScore } from "../types/index.js";
import {
	hasSubstringMatch,
	longestCommonPrefix,
	normalize,
	splitIdentifier,
} from "./helpers.js";
import { jaroWinkler } from "./jaro-winkler.js";

/**
 * Computes Jaccard similarity between token sets
 *
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Jaccard index in [0, 1]
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @invariant ∀s: jaccard(s, s) = 1 (reflexivity)
 * @invariant ∀s1,s2: jaccard(s1, s2) = jaccard(s2, s1) (symmetry)
 * @invariant ∀s1,s2: 0 ≤ jaccard(s1, s2) ≤ 1 (bounded)
 * @complexity O(n + m) where n = |tokens1|, m = |tokens2|
 * @throws Never
 *
 * FORMAT THEOREM: jaccard(A, B) = |A ∩ B| / |A ∪ B|
 */
export function jaccardSimilarity(s1: string, s2: string): SimilarityScore {
	const tokens1 = splitIdentifier(s1);
	const tokens2 = splitIdentifier(s2);

	// INVARIANT: Empty token sets have similarity 0
	if (tokens1.length === 0 || tokens2.length === 0) {
		return makeSimilarityScore(0);
	}

	// CHANGE: Use Set for efficient intersection/union
	// WHY: O(n + m) complexity vs O(n·m) for nested loops
	const set1 = new Set(tokens1);
	const set2 = new Set(tokens2);

	// Calculate intersection: |A ∩ B|
	let intersection = 0;
	for (const token of set1) {
		if (set2.has(token)) {
			intersection++;
		}
	}

	// Calculate union: |A ∪ B| = |A| + |B| - |A ∩ B|
	const union = set1.size + set2.size - intersection;

	// INVARIANT: Union cannot be 0 if both sets non-empty
	if (union === 0) return makeSimilarityScore(0);

	// FORMAT THEOREM: jaccard = |intersection| / |union|
	return makeSimilarityScore(intersection / union);
}

/**
 * Computes containment score (how well one string contains another)
 *
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Containment score in [0, 1]
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @invariant containment(s, s) ≥ 0.8 (high self-containment)
 * @invariant 0 ≤ containment(s1, s2) ≤ 1 (bounded)
 * @complexity O(n) where n = max(|s1|, |s2|)
 * @throws Never
 */
export function containmentScore(s1: string, s2: string): SimilarityScore {
	const hasMatch = hasSubstringMatch(s1, s2);
	return makeSimilarityScore(hasMatch ? 1.0 : 0.0);
}

/**
 * Computes prefix bonus for common prefixes
 *
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Prefix score in [0, 1]
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @invariant prefixScore(s, s) = 1 (reflexivity)
 * @invariant 0 ≤ prefixScore(s1, s2) ≤ 1 (bounded)
 * @complexity O(min(|s1|, |s2|))
 * @throws Never
 *
 * FORMAT THEOREM: prefixScore = min(4, commonPrefix) / 4
 */
export function prefixScore(s1: string, s2: string): SimilarityScore {
	const MAX_PREFIX_BONUS = 4;
	const commonPrefix = longestCommonPrefix(normalize(s1), normalize(s2));
	const boundedPrefix = Math.min(MAX_PREFIX_BONUS, commonPrefix);
	return makeSimilarityScore(boundedPrefix / MAX_PREFIX_BONUS);
}

/**
 * Computes length penalty for significantly different lengths
 *
 * @param userInput - User's typed string
 * @param candidate - Candidate suggestion
 * @returns Penalty in [0, 0.15]
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @invariant penalty(s, s) = 0 (no self-penalty)
 * @invariant ∀s,c: |c| >> |s| → penalty ↑ (increases with length diff)
 * @invariant 0 ≤ penalty ≤ 0.15 (bounded)
 * @complexity O(1)
 * @throws Never
 *
 * FORMAT THEOREM: penalty = min(0.15, max(0, |candidate| - |userInput|) · 0.01)
 */
export function lengthPenalty(userInput: string, candidate: string): number {
	const MAX_PENALTY = 0.15;
	const PENALTY_PER_CHAR = 0.01;
	const lengthDiff = Math.max(0, candidate.length - userInput.length);
	return Math.min(MAX_PENALTY, lengthDiff * PENALTY_PER_CHAR);
}

/**
 * Computes composite similarity score combining multiple algorithms
 *
 * @param userInput - User's typed string
 * @param candidate - Candidate suggestion
 * @returns Composite score in [0, 1]
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @invariant ∀s: compositeScore(s, s) > 0.85 (high self-similarity)
 * @invariant ∀s1,s2: 0 ≤ compositeScore(s1, s2) ≤ 1 (bounded)
 * @invariant ∀s,c: |c| >> |s| → compositeScore(s,c) ↓ (length penalty)
 * @complexity O(n·m) dominated by Jaro-Winkler
 * @throws Never
 *
 * FORMAT THEOREM: compositeScore = clamp(
 *   0.5·jw + 0.3·jaccard + 0.1·containment + 0.1·prefix - penalty,
 *   0, 1
 * )
 */
export function compositeScore(
	userInput: string,
	candidate: string,
): SimilarityScore {
	// CHANGE: Weighted combination of similarity metrics
	// WHY: Multiple dimensions capture different aspects of similarity
	// REF: FUNCTIONAL_ARCHITECTURE.md lines 116-124

	const jw = jaroWinkler(userInput, candidate);
	const jaccard = jaccardSimilarity(userInput, candidate);
	const containment = containmentScore(userInput, candidate);
	const prefix = prefixScore(userInput, candidate);
	const penalty = lengthPenalty(userInput, candidate);

	// WEIGHTS: 50% jw, 30% jaccard, 10% containment, 10% prefix
	const WEIGHT_JW = 0.5;
	const WEIGHT_JACCARD = 0.3;
	const WEIGHT_CONTAINMENT = 0.1;
	const WEIGHT_PREFIX = 0.1;

	// FORMAT THEOREM: weighted sum minus penalty
	const rawScore =
		WEIGHT_JW * jw +
		WEIGHT_JACCARD * jaccard +
		WEIGHT_CONTAINMENT * containment +
		WEIGHT_PREFIX * prefix -
		penalty;

	// INVARIANT: Result must be in [0, 1]
	return makeSimilarityScore(rawScore);
}
