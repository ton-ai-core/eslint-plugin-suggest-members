/**
 * Export parsing utilities
 * CHANGE: Extract export parsing logic to separate module
 * WHY: Reduce function complexity and improve maintainability
 * PURITY: CORE - pure functions only
 */

export interface ParsedExports {
	readonly exported: readonly string[];
	readonly locals: readonly string[];
}

/**
 * Parses exports from file content
 * @param content - File content to parse
 * @returns Parsed export information
 * @purity PURE - no side effects
 */
export const parseExportsFromContent = (content: string): ParsedExports => {
	const exportedNames: string[] = [];
	const localNames: string[] = [];

	parseNamedExports(content, exportedNames, localNames);
	parseExportLists(content, exportedNames, localNames);
	parseDefaultExports(content, exportedNames);
	parseLocalDeclarations(content, localNames);

	return {
		exported: [...new Set(exportedNames)],
		locals: [...new Set(localNames)],
	};
};

const parseNamedExports = (
	content: string,
	exported: string[],
	locals: string[],
): void => {
	const namedExportRegex =
		/export\s+(?:const|let|var|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
	let match;
	while ((match = namedExportRegex.exec(content)) !== null) {
		const matchedName = match[1];
		if (matchedName != null && matchedName.length > 0) {
			exported.push(matchedName);
			locals.push(matchedName);
		}
	}
};

const parseExportLists = (
	content: string,
	exported: string[],
	locals: string[],
): void => {
	const exportListRegex = /export\s*{([^}]+)}/g;
	let match;
	while ((match = exportListRegex.exec(content)) !== null) {
		const exportList = match[1];
		if (exportList != null && exportList.length > 0) {
			const names = exportList.split(",").map((name) => name.trim());
			for (const entry of names) {
				if (entry.length === 0) continue;
				const [localName, exportedName] = splitAlias(entry);
			if (exportedName.length > 0) {
				exported.push(exportedName);
			}
			if (localName.length > 0 && localName !== exportedName) {
				locals.push(localName);
			}
			}
		}
	}
};

const parseDefaultExports = (content: string, exported: string[]): void => {
	if (/export\s+default\s+/.test(content)) {
		exported.push("default");
	}
};

const parseLocalDeclarations = (content: string, locals: string[]): void => {
	const functionDeclRegex = /(?:^|\s)function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
	let match;
	while ((match = functionDeclRegex.exec(content)) !== null) {
		const matchedName = match[1];
		if (matchedName != null && matchedName.length > 0) {
			locals.push(matchedName);
		}
	}

	const variableDeclRegex =
		/(?:^|\s)(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
	while ((match = variableDeclRegex.exec(content)) !== null) {
		const matchedName = match[1];
		if (matchedName != null && matchedName.length > 0) {
			locals.push(matchedName);
		}
	}
};

const splitAlias = (entry: string): readonly [string, string] => {
	const asKeyword = entry.indexOf(" as ");
	if (asKeyword === -1) {
		return [entry.trim(), entry.trim()];
	}

	const localPart = entry.substring(0, asKeyword).trim();
	const exportedPart = entry.substring(asKeyword + 4).trim();
	return [localPart, exportedPart];
};
