// CHANGE: Test fixture - helper module
// WHY: Provide a valid module for import path testing
// PURITY: CORE - pure helper functions

/**
 * Helper function for testing
 *
 * @pure true
 * @complexity O(n)
 */
export function formatString(input: string): string {
	return input.trim().toLowerCase();
}

/**
 * Calculate sum
 *
 * @pure true
 * @complexity O(1)
 */
export function add(a: number, b: number): number {
	return a + b;
}

export const HELPER_CONSTANT = 42;
