// CHANGE: Test fixture - formatter utility
// WHY: Provide a valid nested module for import path testing
// PURITY: CORE - pure formatting functions

/**
 * Format date to ISO string
 *
 * @pure true
 * @complexity O(1)
 */
export function formatDate(date: Date): string {
	return date.toISOString();
}

/**
 * Format number with padding
 *
 * @pure true
 * @complexity O(n) where n = padding length
 */
export function padNumber(num: number, length: number): string {
	return num.toString().padStart(length, "0");
}
