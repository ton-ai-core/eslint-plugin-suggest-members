// CHANGE: Typed TypeScript compiler API interfaces eliminating any types
// WHY: Mathematical rigor through complete type safety
// PURITY: CORE
// REF: system-promt.md - строгая типизация внешних зависимостей

/**
 * TypeScript Symbol interface (simplified)
 *
 * @pure true
 * @purity CORE
 * @invariant name.length > 0
 */
export interface TypeScriptSymbol {
	readonly name: string;
	readonly flags: number;
	readonly valueDeclaration?: TypeScriptNode;
	readonly declarations?: readonly TypeScriptNode[];
	getName(): string;
}

/**
 * TypeScript Type interface (simplified)
 *
 * @pure true
 * @purity CORE
 * @invariant flags >= 0
 */
export interface TypeScriptType {
	readonly flags: number;
	readonly symbol?: TypeScriptSymbol;
	getSymbol(): TypeScriptSymbol | undefined;
	getProperties(): readonly TypeScriptSymbol[];
}

/**
 * TypeScript Node interface (simplified)
 *
 * @pure true
 * @purity CORE
 * @invariant kind >= 0
 */
export interface TypeScriptNode {
	readonly kind: number;
	readonly flags: number;
	readonly parent?: TypeScriptNode;
	getText(): string;
	getSourceFile(): TypeScriptSourceFile;
}

/**
 * TypeScript SourceFile interface (simplified)
 *
 * @pure true
 * @purity CORE
 * @invariant fileName.length > 0
 */
export interface TypeScriptSourceFile extends TypeScriptNode {
	readonly fileName: string;
	readonly text: string;
}

/**
 * TypeScript Checker interface (simplified)
 *
 * @pure true
 * @purity CORE
 * @effect All methods are effectful (interact with compiler)
 */
export interface TypeScriptChecker {
	getSymbolAtLocation(node: TypeScriptNode): TypeScriptSymbol | undefined;
	getTypeAtLocation(node: TypeScriptNode): TypeScriptType;
	getExportsOfModule(
		moduleSymbol: TypeScriptSymbol,
	): readonly TypeScriptSymbol[];
	getTypeOfSymbolAtLocation(
		symbol: TypeScriptSymbol,
		node: TypeScriptNode,
	): TypeScriptType;
}

/**
 * Type guard for TypeScript Symbol
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const isTypeScriptSymbol = (value: object): value is TypeScriptSymbol =>
	typeof value === "object" &&
	value !== null &&
	"name" in value &&
	typeof (value as { name: string }).name === "string" &&
	"getName" in value &&
	typeof (value as { getName: () => string }).getName === "function";

/**
 * Type guard for TypeScript Type
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const isTypeScriptType = (value: object): value is TypeScriptType =>
	typeof value === "object" &&
	value !== null &&
	"flags" in value &&
	typeof (value as { flags: number }).flags === "number" &&
	"getProperties" in value &&
	typeof (value as { getProperties: () => TypeScriptSymbol[] })
		.getProperties === "function";

/**
 * Type guard for TypeScript Node
 *
 * @pure true
 * @purity CORE
 * @complexity O(1)
 * @throws Never
 */
export const isTypeScriptNode = (value: object): value is TypeScriptNode =>
	typeof value === "object" &&
	value !== null &&
	"kind" in value &&
	typeof (value as { kind: number }).kind === "number" &&
	"getText" in value &&
	typeof (value as { getText: () => string }).getText === "function";
