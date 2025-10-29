// CHANGE: Core validation functions for candidates
// WHY: Pure validation logic without side effects
// PURITY: CORE
// REF: system-promt.md - чистые функции валидации

/**
 * Common extensions for TypeScript/JavaScript files
 *
 * @purity CORE
 */
export const SUPPORTED_EXTENSIONS = [
	".ts",
	".tsx",
	".js",
	".jsx",
	".json",
] as const;

/**
 * Checks if candidate is valid for suggestions
 *
 * @param candidate - Candidate name
 * @param target - Target name to compare against (optional)
 * @returns true if candidate is valid
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @invariant ∀c: isValidCandidate(c, t) → c.length > 0 ∧ ¬c.startsWith("_") ∧ c ≠ t
 * @complexity O(1)
 * @throws Never
 */
export function isValidCandidate(candidate: string, target?: string): boolean {
	// CHANGE: Basic validation - non-empty and not private
	// WHY: Filter out invalid suggestions
	if (candidate.length === 0 || candidate.startsWith("_")) {
		return false;
	}

	// CHANGE: Exclude exact matches
	// WHY: Don't suggest what user already typed
	if (target !== undefined && candidate === target) {
		return false;
	}

	return true;
}

/**
 * Gets minimum similarity score threshold
 *
 * @returns Minimum score threshold
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @invariant result ∈ [0.33, 0.35]
 * @complexity O(1)
 * @throws Never
 */
export function getMinimumSimilarityScore(): number {
	return 0.34;
}
