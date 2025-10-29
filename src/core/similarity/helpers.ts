// CHANGE: Helper functions for string manipulation
// WHY: Pure functions for normalization and tokenization
// PURITY: CORE

/**
 * Splits identifier into tokens by camelCase and separators
 *
 * @param identifier - Identifier to tokenize
 * @returns Array of lowercase tokens
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @invariant ∀t ∈ result: t.length > 0
 * @invariant ∀t ∈ result: t === t.toLowerCase()
 * @complexity O(n) where n = identifier.length
 * @throws Never
 *
 * FORMAT THEOREM: splitIdentifier: String → Token[]
 */
export function splitIdentifier(identifier: string): readonly string[] {
	// CHANGE: Split on camelCase, underscores, spaces, digits
	// WHY: Common identifier conventions in JS/TS
	return identifier
		.split(/(?=[A-Z])|[_\s\d]/)
		.map((s) => s.toLowerCase())
		.filter(Boolean);
}

/**
 * Normalizes string by lowercasing and removing separators
 *
 * @param str - String to normalize
 * @returns Normalized string
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @invariant result === result.toLowerCase()
 * @invariant !/[_\s.\/-]/.test(result)
 * @complexity O(n) where n = str.length
 * @throws Never
 *
 * FORMAT THEOREM: normalize: String → NormalizedString
 */
export function normalize(str: string): string {
	// CHANGE: Remove separators and lowercase
	// WHY: Case-insensitive comparison ignoring formatting
	return str.toLowerCase().replace(/[_\s./-]/g, "");
}

/**
 * Calculates longest common prefix length
 *
 * @param a - First string
 * @param b - Second string
 * @returns Length of common prefix
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @invariant result ≤ min(a.length, b.length)
 * @invariant ∀i < result: a[i] = b[i]
 * @complexity O(min(|a|, |b|))
 * @throws Never
 */
export function longestCommonPrefix(a: string, b: string): number {
	const n = Math.min(a.length, b.length);
	let i = 0;

	// INVARIANT: All characters before i match
	while (i < n && a[i] === b[i]) {
		i++;
	}

	return i;
}

/**
 * Checks if one string contains another (after normalization)
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(n) where n = max(|a|, |b|)
 * @throws Never
 */
export function hasSubstringMatch(a: string, b: string): boolean {
	const normA = normalize(a);
	const normB = normalize(b);

	if (normA.length === 0 || normB.length === 0) return false;

	return normA.includes(normB) || normB.includes(normA);
}
