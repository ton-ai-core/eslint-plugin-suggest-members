// CHANGE: Pure predicates for ESLint node validation
// WHY: Separate decision logic (CORE) from ESLint integration (SHELL)
// PURITY: CORE
// REF: CLAUDE.md - pure predicates in CORE layer

import {
	type BaseESLintNode,
	type ESLintImportDeclaration,
	type ESLintImportSpecifier,
	type ESLintMemberExpression,
	isImportDeclaration,
	isImportSpecifier,
	isMemberExpression,
} from "../types/eslint-nodes.js";

/**
 * Checks if member expression should be skipped
 *
 * @param node - Unknown node (type-guarded internally)
 * @returns true if node should be skipped
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @invariant Decision based only on node structure
 * @complexity O(1)
 * @throws Never
 */
export function shouldSkipMemberExpression(node: object): boolean {
	// CHANGE: Type guard for safety
	// WHY: Eliminate any types through runtime validation
	if (!isMemberExpression(node as BaseESLintNode)) return true;

	const memberNode = node as ESLintMemberExpression;

	// CHANGE: Skip computed member access (obj[prop])
	// WHY: Cannot validate dynamic property access
	if (memberNode.computed === true) return true;

	// CHANGE: Skip nested member expressions (obj.a.b - skip the outer one)
	// WHY: Inner validation is sufficient
	if (memberNode.object.type === "MemberExpression") return true;

	// CHANGE: Skip optional chaining
	// WHY: Type narrowing makes validation unreliable
	if (memberNode.optional === true) return true;

	return false;
}

/**
 * Checks if identifier should be skipped
 *
 * @param name - Identifier name
 * @returns true if identifier should be skipped
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(1)
 * @throws Never
 */
export function shouldSkipIdentifier(name: string): boolean {
	// CHANGE: Skip empty names
	// WHY: Invalid identifiers
	if (name.length === 0) return true;

	// CHANGE: Skip private identifiers
	// WHY: Private members are not accessible
	if (name.startsWith("_")) return true;

	// CHANGE: Skip TypeScript internal symbols
	// WHY: Internal symbols are not user-accessible
	if (name.startsWith("__")) return true;

	return false;
}

/**
 * Extracts property name from member expression
 *
 * @param node - Unknown node (type-guarded internally)
 * @returns Property name or empty string
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @invariant Result is non-null string
 * @complexity O(1)
 * @throws Never
 */
export function extractPropertyName(node: object): string {
	// CHANGE: Type guard for safety
	// WHY: Eliminate any types through runtime validation
	if (!isMemberExpression(node as BaseESLintNode)) return "";

	const memberNode = node as ESLintMemberExpression;

	// CHANGE: Only handle identifier properties (not computed)
	// WHY: Computed properties are dynamic and cannot be validated
	if (memberNode.property.type === "Identifier") {
		return memberNode.property.name;
	}

	return "";
}

/**
 * Checks if string literal represents a module path
 *
 * @param value - String value to check
 * @returns true if value looks like a module path
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(1)
 * @throws Never
 */
export function isModulePath(value: string): boolean {
	// Relative paths
	if (value.startsWith("./") || value.startsWith("../")) return true;

	// Absolute paths
	if (value.startsWith("/")) return true;

	// Node built-in modules
	if (value.startsWith("node:")) return true;

	// Package names (scoped or unscoped)
	if (
		value.startsWith("@") ||
		/^[a-z0-9-]+$/i.test(value.split("/")[0] ?? "")
	) {
		return true;
	}

	return false;
}

/**
 * Extracts module name from import path
 *
 * @param importPath - Full import path
 * @returns Module name without extensions or subpaths
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(n) where n = path length
 * @throws Never
 *
 * @example
 * extractModuleName('./utils/helpers.ts') → 'helpers'
 * extractModuleName('@scope/package/module') → '@scope/package'
 * extractModuleName('lodash') → 'lodash'
 */
export function extractModuleName(importPath: string): string {
	// CHANGE: Handle scoped packages
	// WHY: Scoped packages like @org/package need special handling
	if (importPath.startsWith("@")) {
		const parts = importPath.split("/");
		if (parts.length >= 2) {
			return `${parts[0]}/${parts[1]}`;
		}
		return importPath;
	}

	// CHANGE: Handle relative paths
	// WHY: Extract filename without extension
	if (importPath.startsWith("./") || importPath.startsWith("../")) {
		const parts = importPath.split("/");
		const filename = parts[parts.length - 1] ?? "";
		return filename.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, "");
	}

	// CHANGE: Handle node built-ins
	// WHY: Remove 'node:' prefix
	if (importPath.startsWith("node:")) {
		return importPath.slice(5);
	}

	// CHANGE: Handle package names
	// WHY: First segment is package name
	const firstSlash = importPath.indexOf("/");
	if (firstSlash === -1) return importPath;
	return importPath.slice(0, firstSlash);
}

/**
 * Checks if import specifier is a type-only import
 *
 * @param node - Unknown node (type-guarded internally)
 * @returns true if type-only import
 *
 * @pure true
 * @purity CORE
 * @effect None
 * @complexity O(1)
 * @throws Never
 */
export function isTypeOnlyImport(node: object): boolean {
	// CHANGE: Type guard for import declaration
	// WHY: Eliminate any types through runtime validation
	if (isImportDeclaration(node as BaseESLintNode)) {
		return (node as ESLintImportDeclaration).importKind === "type";
	}

	// CHANGE: Type guard for import specifier
	// WHY: Eliminate any types through runtime validation
	if (isImportSpecifier(node as BaseESLintNode)) {
		return (node as ESLintImportSpecifier).importKind === "type";
	}

	return false;
}
