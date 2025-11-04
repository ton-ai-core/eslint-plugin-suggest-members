import { relative } from "node:path";

// CHANGE: Track canonical module extensions for deterministic stripping
// WHY: Longest-match ordering preserves `.d.ts` / `.d.mts` semantics while aligning runtime and type resolution
// QUOTE(ТЗ): "не учитывая расширения файлов"
// REF: user-message-2025-10-25
// SOURCE: https://www.typescriptlang.org/docs/handbook/modules/reference.html#file-extension-substitution - "TypeScript can resolve to a .ts or .d.ts file even if the module specifier explicitly uses a .js file extension."
// FORMAT THEOREM: ∀e ∈ MODULE_FILE_EXTENSIONS: ordered(e) → preciseStrip(e)
// PURITY: CORE
// INVARIANT: MODULE_FILE_EXTENSIONS sorted by length ensures deterministic removal of multi-part extensions
// COMPLEXITY: O(1) initialization
export const MODULE_FILE_EXTENSIONS = [
	".d.cts",
	".d.mts",
	".d.ts",
	".cts",
	".mts",
	".tsx",
	".ts",
	".jsx",
	".js",
	".cjs",
	".mjs",
	".json",
] as const;

// CHANGE: Strip extensions using canonical ordered list
// WHY: Ensure `.js` specifiers map to `.ts` sources for bundler/nodenext resolution
// QUOTE(ТЗ): "не учитывая расширения файлов"
// REF: user-message-2025-10-25
// SOURCE: https://www.typescriptlang.org/docs/handbook/modules/reference.html#file-extension-substitution - "TypeScript can resolve to a .ts or .d.ts file even if the module specifier explicitly uses a .js file extension."
// FORMAT THEOREM: ∀f ∈ Files: strip(f) = f \ e, e ∈ MODULE_FILE_EXTENSIONS ∨ strip(f) = f
// PURITY: CORE
// INVARIANT: Result never retains trailing known extension segment
// COMPLEXITY: O(|MODULE_FILE_EXTENSIONS|)
export const stripKnownExtension = (fileName: string): string => {
	for (const extension of MODULE_FILE_EXTENSIONS) {
		if (fileName.endsWith(extension)) {
			return fileName.slice(0, -extension.length);
		}
	}
	return fileName;
};

export const normalizeModuleSpecifier = (
	containingDir: string,
	absoluteCandidateWithoutExtension: string,
): string => {
	const relativePath = relative(
		containingDir,
		absoluteCandidateWithoutExtension,
	)
		.replace(/\\/g, "/")
		.trim();
	if (relativePath.length === 0) {
		return "./";
	}
	return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
};
