import { relative } from "node:path";

const EXTENSION_REGEX = /\.(ts|tsx|js|jsx|json|mjs|cjs)$/;

export const stripKnownExtension = (fileName: string): string =>
	fileName.replace(EXTENSION_REGEX, "");

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
