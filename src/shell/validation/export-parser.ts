/**
 * Export parsing utilities
 * CHANGE: Extract export parsing logic to separate module
 * WHY: Reduce function complexity and improve maintainability
 * PURITY: CORE - pure functions only
 */

/**
 * Parses exports from file content
 * @param content - File content to parse
 * @returns Array of exported names
 * @purity PURE - no side effects
 */
export const parseExportsFromContent = (content: string): string[] => {
	const exports: string[] = [];

	// Parse named exports (export const/let/var/function/class name)
	parseNamedExports(content, exports);

	// Parse export lists (export { name1, name2 })
	parseExportLists(content, exports);

	// Parse default exports
	parseDefaultExports(content, exports);

	return [...new Set(exports)]; // Remove duplicates
};

/**
 * Parses named exports from content
 * @param content - File content
 * @param exports - Array to push exports to
 * @purity PURE - no side effects (mutates input array)
 */
const parseNamedExports = (content: string, exports: string[]): void => {
	const namedExportRegex =
		/export\s+(?:const|let|var|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
	let match;
	while ((match = namedExportRegex.exec(content)) !== null) {
		const matchedName = match[1];
		if (matchedName != null && matchedName.length > 0) {
			exports.push(matchedName);
		}
	}
};

/**
 * Parses export lists from content
 * @param content - File content
 * @param exports - Array to push exports to
 * @purity PURE - no side effects (mutates input array)
 */
const parseExportLists = (content: string, exports: string[]): void => {
	const exportListRegex = /export\s*{([^}]+)}/g;
	let match;
	while ((match = exportListRegex.exec(content)) !== null) {
		const exportList = match[1];
		if (exportList != null && exportList.length > 0) {
			const names = exportList.split(",").map((name) => {
				const trimmed = name.trim();
				// Handle "name as alias" syntax
				const asIndex = trimmed.indexOf(" as ");
				return asIndex > -1 ? trimmed.substring(0, asIndex).trim() : trimmed;
			});
			exports.push(...names.filter((name) => name.length > 0));
		}
	}
};

/**
 * Parses default exports from content
 * @param content - File content
 * @param exports - Array to push exports to
 * @purity PURE - no side effects (mutates input array)
 */
const parseDefaultExports = (content: string, exports: string[]): void => {
	// Check for default export
	if (/export\s+default\s+/.test(content)) {
		exports.push("default");
	}
};
