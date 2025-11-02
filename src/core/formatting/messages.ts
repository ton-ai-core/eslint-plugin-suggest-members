// CHANGE: Core message formatting functions
// WHY: Pure string formatting without side effects
// PURITY: CORE
// REF: system-promt.md - чистые функции форматирования

import type { SuggestionWithScore } from "../types/domain-types.js";

// CHANGE: Changed to multi-line bullet list format with limit of 5 suggestions
// WHY: Improved readability and consistency with TypeScript error format
// QUOTE: "Ошибки должны быть в таком стиле: [multi-line format]"
// QUOTE: "мы выводим до 5 самых вероятных элементов"

const MAX_SUGGESTIONS = 5;

/**
 * Formats suggestion list into readable string
 *
 * @param suggestions - Scored suggestions
 * @returns Formatted message
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(n) where n = min(|suggestions|, MAX_SUGGESTIONS)
 * @throws Never
 */
export function formatSuggestionMessage(
	suggestions: readonly SuggestionWithScore[],
): string {
	if (suggestions.length === 0) {
		return "No similar suggestions found.";
	}

	const topSuggestions = suggestions.slice(0, MAX_SUGGESTIONS);
	const bulletList = topSuggestions.map((s) => `  - ${s.name}`).join("\n");

	return `Did you mean:\n${bulletList}`;
}

/**
 * Common suggestion list formatter with multi-line bullet list
 *
 * CHANGE: Added type signature display for methods and properties
 * WHY: Help developers understand what they're importing/using
 * FORMAT: "  - name: signature" or "  - name" if no signature
 *
 * @purity CORE
 * @complexity O(n) where n = min(|suggestions|, MAX_SUGGESTIONS)
 */
const formatSuggestionList = (
	suggestions: readonly SuggestionWithScore[],
): string => {
	const topSuggestions = suggestions.slice(0, MAX_SUGGESTIONS);
	return topSuggestions
		.map((s) => {
			// CHANGE: Include type signature if available
			// WHY: Provides context about what the suggested export/member is
			if (s.signature !== undefined && s.signature.length > 0) {
				return `  - ${s.name}: ${s.signature}`;
			}
			return `  - ${s.name}`;
		})
		.join("\n");
};

/**
 * Formats member validation message with full context
 *
 * @param propertyName - Property name that was not found
 * @param typeName - Type name where property was accessed (optional)
 * @param suggestions - Scored suggestions
 * @returns Formatted message
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(n) where n = min(|suggestions|, MAX_SUGGESTIONS)
 * @throws Never
 */
export function formatMemberMessage(
	propertyName: string,
	typeName: string | undefined,
	suggestions: readonly SuggestionWithScore[],
): string {
	const typeContext = typeName !== undefined ? ` on type "${typeName}"` : "";
	const prefix = `Property "${propertyName}" does not exist${typeContext}. Did you mean`;
	return `${prefix}:\n${formatSuggestionList(suggestions)}`;
}

/**
 * Formats import validation message with full context
 *
 * @param importName - Import name that was not found
 * @param modulePath - Module path being imported from
 * @param suggestions - Scored suggestions
 * @returns Formatted message
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(n) where n = min(|suggestions|, MAX_SUGGESTIONS)
 * @throws Never
 */
export function formatImportMessage(
	importName: string,
	modulePath: string,
	suggestions: readonly SuggestionWithScore[],
): string {
	const prefix = `Cannot find export "${importName}" in module "${modulePath}". Did you mean`;
	return `${prefix}:\n${formatSuggestionList(suggestions)}`;
}

/**
 * Formats module path validation message with full context
 *
 * @param requestedPath - Module path that was not found
 * @param suggestions - Scored suggestions
 * @returns Formatted message
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(n) where n = min(|suggestions|, MAX_SUGGESTIONS)
 * @throws Never
 */
export function formatModuleMessage(
	requestedPath: string,
	suggestions: readonly SuggestionWithScore[],
): string {
	const prefix = `Cannot find module "${requestedPath}". Did you mean`;
	return `${prefix}:\n${formatSuggestionList(suggestions)}`;
}
