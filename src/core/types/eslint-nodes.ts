// CHANGE: Typed ESLint node interfaces eliminating any types
// WHY: Mathematical rigor through complete type safety
// PURITY: CORE
// REF: system-promt.md - никогда any, unknown, eslint-disable

/**
 * Base ESLint node interface
 *
 * @pure true
 * @purity CORE
 */
export interface BaseESLintNode {
	readonly type: string;
	readonly [key: string]: string | number | boolean | object | undefined | null;
}

/**
 * ESLint MemberExpression node interface
 *
 * @pure true
 * @purity CORE
 * @invariant object ∧ property ∧ computed ∈ {true, false}
 */
export interface ESLintMemberExpression extends BaseESLintNode {
	readonly type: "MemberExpression";
	readonly object: ESLintNode;
	readonly property: ESLintNode;
	readonly computed: boolean;
	readonly optional?: boolean;
	readonly parent?: ESLintNode;
}

/**
 * ESLint ImportSpecifier node interface
 *
 * @pure true
 * @purity CORE
 * @invariant imported ∧ local
 */
export interface ESLintImportSpecifier extends BaseESLintNode {
	readonly type: "ImportSpecifier";
	readonly imported: ESLintIdentifier;
	readonly local: ESLintIdentifier;
	readonly importKind?: "type" | "typeof" | "value";
}

/**
 * ESLint ImportDeclaration node interface
 *
 * @pure true
 * @purity CORE
 * @invariant source ∧ specifiers
 */
export interface ESLintImportDeclaration extends BaseESLintNode {
	readonly type: "ImportDeclaration";
	readonly source: ESLintLiteral;
	readonly specifiers: readonly ESLintImportSpecifier[];
	readonly importKind?: "type" | "typeof" | "value";
}

/**
 * ESLint CallExpression node interface
 *
 * @pure true
 * @purity CORE
 * @invariant callee ∧ arguments
 */
export interface ESLintCallExpression extends BaseESLintNode {
	readonly type: "CallExpression";
	readonly callee: ESLintNode;
	readonly arguments: readonly ESLintNode[];
	readonly optional?: boolean;
}

/**
 * ESLint Identifier node interface
 *
 * @pure true
 * @purity CORE
 * @invariant name.length > 0
 */
export interface ESLintIdentifier extends BaseESLintNode {
	readonly type: "Identifier";
	readonly name: string;
}

/**
 * ESLint Literal node interface
 *
 * @pure true
 * @purity CORE
 * @invariant value !== undefined
 */
export interface ESLintLiteral extends BaseESLintNode {
	readonly type: "Literal";
	readonly value: string | number | boolean | null | RegExp;
	readonly raw: string;
}

/**
 * Union of all ESLint node types
 *
 * @pure true
 * @purity CORE
 * @invariant Exhaustive union of all node types
 */
export type ESLintNode =
	| ESLintMemberExpression
	| ESLintImportSpecifier
	| ESLintImportDeclaration
	| ESLintCallExpression
	| ESLintIdentifier
	| ESLintLiteral;

/**
 * Type guard for MemberExpression
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const isMemberExpression = (
	node: BaseESLintNode,
): node is ESLintMemberExpression => node.type === "MemberExpression";

/**
 * Type guard for ImportSpecifier
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const isImportSpecifier = (
	node: BaseESLintNode,
): node is ESLintImportSpecifier => node.type === "ImportSpecifier";

/**
 * Type guard for ImportDeclaration
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const isImportDeclaration = (
	node: BaseESLintNode,
): node is ESLintImportDeclaration => node.type === "ImportDeclaration";

/**
 * Type guard for CallExpression
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const isCallExpression = (
	node: BaseESLintNode,
): node is ESLintCallExpression => node.type === "CallExpression";

/**
 * Type guard for Identifier
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const isIdentifier = (node: BaseESLintNode): node is ESLintIdentifier =>
	node.type === "Identifier";
