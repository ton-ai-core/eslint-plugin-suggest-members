// CHANGE: Jaro-Winkler similarity with prefix bonus
// WHY: Rewards common prefixes (common in identifiers)
// PURITY: CORE
// REF: Winkler, W. E. (1990). "String Comparator Metrics"

import type { SimilarityScore } from "../types/index.js";
import { makeSimilarityScore } from "../types/index.js";
import { jaro } from "./jaro.js";

/**
 * Computes Jaro-Winkler similarity with prefix bonus
 *
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Jaro-Winkler similarity in [0, 1]
 *
 * @pure true
 * @purity CORE
 * @effect None - pure computation
 * @invariant ∀s1,s2: jaroWinkler(s1,s2) ≥ jaro(s1,s2) (prefix bonus)
 * @invariant ∀s1,s2: 0 ≤ jaroWinkler(s1,s2) ≤ 1 (bounded)
 * @precondition true
 * @postcondition result ∈ [0, 1] ∧ result ≥ jaro(s1, s2)
 * @complexity O(n·m) where n = |s1|, m = |s2|
 * @throws Never
 *
 * FORMAT THEOREM: jaroWinkler(s1,s2) = jaro(s1,s2) + prefix·p·(1 - jaro(s1,s2))
 *                 where p = 0.1, prefix ≤ 4
 */
export function jaroWinkler(s1: string, s2: string): SimilarityScore {
	const jaroSim = jaro(s1, s2);

	// CHANGE: Calculate common prefix (max 4 chars)
	// WHY: Jaro-Winkler bonus for prefixes, standard limit is 4
	// SOURCE: Original Winkler paper
	let prefix = 0;
	const MAX_PREFIX_LENGTH = 4;
	const minLength = Math.min(MAX_PREFIX_LENGTH, s1.length, s2.length);

	for (let i = 0; i < minLength; i++) {
		if (s1[i] === s2[i]) {
			prefix++;
		} else {
			break;
		}
	}

	// CHANGE: Apply Jaro-Winkler formula
	// WHY: Standard scaling factor p = 0.1
	// FORMAT THEOREM: result = jaroSim + prefix · 0.1 · (1 - jaroSim)
	const SCALING_FACTOR = 0.1;
	const result = jaroSim + prefix * SCALING_FACTOR * (1 - jaroSim);

	// INVARIANT: Result must be at least as large as Jaro and ≤ 1
	return makeSimilarityScore(result);
}
