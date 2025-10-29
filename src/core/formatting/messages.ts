// CHANGE: Core message formatting functions
// WHY: Pure string formatting without side effects
// PURITY: CORE
// REF: system-promt.md - чистые функции форматирования

import type { SuggestionWithScore } from "../types/domain-types.js";

/**
 * Formats suggestion list into readable string
 *
 * @param suggestions - Scored suggestions
 * @returns Formatted message
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(n) where n = |suggestions|
 * @throws Never
 */
export function formatSuggestionMessage(
	suggestions: readonly SuggestionWithScore[],
): string {
	if (suggestions.length === 0) {
		return "No similar suggestions found.";
	}

	const suggestionList = suggestions.map((s) => `'${s.name}'`).join(", ");

	return `Did you mean ${suggestionList}?`;
}

/**
 * Common suggestion list formatter
 *
 * @purity CORE
 * @complexity O(n)
 */
const formatSuggestionList = (
	suggestions: readonly SuggestionWithScore[],
): string => suggestions.map((s) => `'${s.name}'`).join(", ");

/**
 * Generic suggestion message formatter
 *
 * @purity CORE
 * @complexity O(n)
 */
const createSuggestionMessage = (
	prefix: string,
	suggestions: readonly SuggestionWithScore[],
): string => {
	if (suggestions.length === 0) {
		return "No similar suggestions found.";
	}
	return `${prefix} ${formatSuggestionList(suggestions)}?`;
};

/**
 * Formats member validation message
 *
 * @param suggestions - Scored suggestions
 * @returns Formatted message
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(n) where n = |suggestions|
 * @throws Never
 */
export function formatMemberMessage(
	suggestions: readonly SuggestionWithScore[],
): string {
	return createSuggestionMessage("Did you mean", suggestions);
}

/**
 * Formats import validation message
 *
 * @param suggestions - Scored suggestions
 * @returns Formatted message
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(n) where n = |suggestions|
 * @throws Never
 */
export function formatImportMessage(
	suggestions: readonly SuggestionWithScore[],
): string {
	return createSuggestionMessage("Did you mean", suggestions);
}

/**
 * Formats module path validation message
 *
 * @param suggestions - Scored suggestions
 * @returns Formatted message
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(n) where n = |suggestions|
 * @throws Never
 */
export function formatModuleMessage(
	suggestions: readonly SuggestionWithScore[],
): string {
	return createSuggestionMessage("Did you mean", suggestions);
}
