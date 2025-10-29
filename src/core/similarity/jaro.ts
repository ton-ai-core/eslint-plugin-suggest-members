// CHANGE: Jaro similarity algorithm - pure implementation
// WHY: Mathematical correctness with provable properties
// PURITY: CORE
// REF: Jaro, M. A. (1989). "Advances in Record-Linkage Methodology"

import type { SimilarityScore } from "../types/index.js";
import { makeSimilarityScore } from "../types/index.js";

/**
 * Finds matching characters within distance
 *
 * @purity CORE
 * @complexity O(n·m)
 */
const findMatches = (
	s1: string,
	s2: string,
	matchDistance: number,
): { matches: number; s1Matches: boolean[]; s2Matches: boolean[] } => {
	const len1 = s1.length;
	const len2 = s2.length;
	const s1Matches = new Array<boolean>(len1).fill(false);
	const s2Matches = new Array<boolean>(len2).fill(false);
	let matches = 0;

	for (let i = 0; i < len1; i++) {
		const start = Math.max(0, i - matchDistance);
		const end = Math.min(i + matchDistance + 1, len2);

		for (let j = start; j < end; j++) {
			if (s2Matches[j] === true) continue;
			if (s1[i] !== s2[j]) continue;

			s1Matches[i] = true;
			s2Matches[j] = true;
			matches++;
			break;
		}
	}

	return { matches, s1Matches, s2Matches };
};

/**
 * Counts transpositions in matched characters
 *
 * @purity CORE
 * @complexity O(n)
 */
const countTranspositions = (
	s1: string,
	s2: string,
	s1Matches: boolean[],
	s2Matches: boolean[],
): number => {
	let transpositions = 0;
	let k = 0;

	for (let i = 0; i < s1.length; i++) {
		if (s1Matches[i] !== true) continue;
		while (s2Matches[k] !== true) k++;
		if (s1[i] !== s2[k]) transpositions++;
		k++;
	}

	return transpositions;
};

/**
 * Computes Jaro similarity between two strings
 *
 * @param s1 - First string for comparison
 * @param s2 - Second string for comparison
 * @returns Jaro similarity score in [0, 1]
 *
 * @pure true
 * @purity CORE
 * @effect None - pure computation
 * @invariant ∀s: jaro(s, s) = 1 (reflexivity)
 * @invariant ∀s1,s2: jaro(s1, s2) = jaro(s2, s1) (symmetry)
 * @invariant ∀s1,s2: 0 ≤ jaro(s1, s2) ≤ 1 (bounded)
 * @precondition true (accepts any strings)
 * @postcondition result ∈ [0, 1]
 * @complexity O(n·m) where n = |s1|, m = |s2|
 * @throws Never
 *
 * FORMAT THEOREM: jaro: String × String → [0,1]
 */
export function jaro(s1: string, s2: string): SimilarityScore {
	// INVARIANT: Identity case
	if (s1 === s2) return makeSimilarityScore(1);

	const len1 = s1.length;
	const len2 = s2.length;

	// INVARIANT: Empty strings have similarity 0
	if (len1 === 0 || len2 === 0) return makeSimilarityScore(0);

	// CHANGE: Match distance per Jaro algorithm
	const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

	const { matches, s1Matches, s2Matches } = findMatches(s1, s2, matchDistance);

	// INVARIANT: No matches means similarity is 0
	if (matches === 0) return makeSimilarityScore(0);

	const transpositions = countTranspositions(s1, s2, s1Matches, s2Matches);

	// FORMAT THEOREM: jaro = (m/|s1| + m/|s2| + (m-t)/m) / 3
	const result =
		(matches / len1 +
			matches / len2 +
			(matches - transpositions / 2) / matches) /
		3;

	return makeSimilarityScore(result);
}
