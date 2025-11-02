// CHANGE: Helper functions for TypeScript compiler service
// WHY: Reduce file size and improve code organization
// PURITY: SHELL
// REF: CLAUDE.md - Clean Code principles

import * as ts from "typescript";

/**
 * Find context source file for module resolution
 *
 * @purity CORE
 * @complexity O(n) where n = number of source files
 */
export const findContextFile = (
	program: ts.Program,
): ts.SourceFile | undefined => {
	const files = program.getSourceFiles();
	return (
		files.find((sf) => !sf.isDeclarationFile && sf.fileName.endsWith(".ts")) ||
		files[0]
	);
};

/**
 * Resolve module symbol from resolved module
 *
 * @purity SHELL
 * @complexity O(1)
 */
export const resolveModuleSymbol = (
	checker: ts.TypeChecker,
	program: ts.Program,
	moduleResolution: ts.ResolvedModuleWithFailedLookupLocations,
): ts.Symbol | undefined => {
	if (!moduleResolution.resolvedModule) {
		return undefined;
	}

	const resolvedFile = program.getSourceFile(
		moduleResolution.resolvedModule.resolvedFileName,
	);
	return resolvedFile ? checker.getSymbolAtLocation(resolvedFile) : undefined;
};

/**
 * Find module symbol in global scope
 *
 * @purity SHELL
 * @complexity O(n) where n = number of global symbols
 */
export const findGlobalModuleSymbol = (
	checker: ts.TypeChecker,
	contextFile: ts.SourceFile,
	modulePath: string,
): ts.Symbol | undefined => {
	const globalSymbols = checker.getSymbolsInScope(
		contextFile,
		ts.SymbolFlags.Module | ts.SymbolFlags.Namespace,
	);

	return globalSymbols.find((symbol) => {
		const name = symbol.getName();
		return (
			name === modulePath ||
			name === `"${modulePath}"` ||
			name.includes(modulePath)
		);
	});
};

/**
 * Find ambient module symbol
 *
 * @purity SHELL
 * @complexity O(n) where n = number of ambient modules
 */
export const findAmbientModuleSymbol = (
	checker: ts.TypeChecker,
	modulePath: string,
): ts.Symbol | undefined => {
	const ambientModules = checker.getAmbientModules();
	return ambientModules.find(
		(am) => am.getName() === `"${modulePath}"` || am.getName() === modulePath,
	);
};

/**
 * Extract export names from module symbol
 *
 * @purity SHELL
 * @complexity O(n) where n = number of exports
 */
export const extractExportNames = (
	checker: ts.TypeChecker,
	moduleSymbol: ts.Symbol,
): readonly string[] => {
	const exports = checker.getExportsOfModule(moduleSymbol);
	return exports
		.map((exp) => exp.getName())
		.filter((name): name is string => name.length > 0);
};

/**
 * Find module symbol using TypeScript resolution
 *
 * @purity SHELL
 * @complexity O(n) where n = number of symbols
 */
export const findModuleSymbol = (
	checker: ts.TypeChecker,
	program: ts.Program,
	modulePath: string,
	contextFile: ts.SourceFile,
): ts.Symbol | undefined => {
	const compilerOptions = program.getCompilerOptions();
	const moduleResolution = ts.resolveModuleName(
		modulePath,
		contextFile.fileName,
		compilerOptions,
		ts.sys,
	);

	return (
		resolveModuleSymbol(checker, program, moduleResolution) ||
		findGlobalModuleSymbol(checker, contextFile, modulePath) ||
		findAmbientModuleSymbol(checker, modulePath)
	);
};
