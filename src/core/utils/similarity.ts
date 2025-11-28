// CHANGE: Shared similarity calculation utilities
// WHY: Eliminate code duplication between validation modules
// PURITY: CORE (pure mathematical functions)

/**
 * Finds similar names using simple string similarity
 * @param target - Target name to match
 * @param candidates - Candidate names
 * @returns Array of similar names
 * @complexity O(n*m) where n = candidates length, m = average string length
 * @purity PURE - no side effects
 */
export const findSimilarNames = (
	target: string,
	candidates: string[],
): string[] =>
	candidates
		.filter((candidate) => {
			// CHANGE: Simple similarity check
			// WHY: Find names that are likely typos
			const similarity = calculateSimilarity(target, candidate);
			return similarity > 0.6; // 60% similarity threshold
		})
		.sort((a, b) => {
			// CHANGE: Sort by similarity (most similar first)
			// WHY: Show best suggestions first
			const simA = calculateSimilarity(target, a);
			const simB = calculateSimilarity(target, b);
			return simB - simA;
		})
		.slice(0, 3); // Limit to top 3 suggestions

/**
 * Calculates string similarity using Levenshtein distance
 * @param a - First string
 * @param b - Second string
 * @returns Similarity ratio (0-1)
 * @complexity O(n*m) where n, m are string lengths
 * @purity PURE - no side effects
 */
export const calculateSimilarity = (a: string, b: string): number => {
	if (a === b) return 1;
	if (a.length === 0 || b.length === 0) return 0;

	const maxLength = Math.max(a.length, b.length);
	const distance = levenshteinDistance(a, b);
	return (maxLength - distance) / maxLength;
};

/**
 * Calculates Levenshtein distance between two strings
 * @param a - First string
 * @param b - Second string
 * @returns Edit distance
 * @complexity O(n*m) where n, m are string lengths
 * @purity PURE - no side effects
 */
export const levenshteinDistance = (a: string, b: string): number => {
	const matrix: number[][] = Array.from({ length: b.length + 1 }, () =>
		Array.from({ length: a.length + 1 }, () => 0),
	);

	const ensureRow = (index: number): number[] => {
		const row = matrix[index];
		if (row === undefined) {
			throw new Error(`Matrix invariant violated: missing row ${index}`);
		}
		return row;
	};

	const readValue = (row: readonly number[], column: number): number => {
		const value = row[column];
		if (value === undefined) {
			throw new Error(
				`Matrix invariant violated: missing value at column ${column}`,
			);
		}
		return value;
	};

	const firstRow = ensureRow(0);
	for (let i = 0; i <= a.length; i++) {
		firstRow[i] = i;
	}

	for (let j = 1; j <= b.length; j++) {
		const currentRow = ensureRow(j);
		currentRow[0] = j;
		const previousRow = ensureRow(j - 1);

		for (let i = 1; i <= a.length; i++) {
			const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
			const deletion = readValue(currentRow, i - 1) + 1;
			const insertion = readValue(previousRow, i) + 1;
			const substitution = readValue(previousRow, i - 1) + indicator;

			currentRow[i] = Math.min(deletion, insertion, substitution);
		}
	}

	return readValue(ensureRow(b.length), a.length);
};
