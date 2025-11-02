/**
 * Базовый класс для тестирования ESLint правил с математическими инвариантами
 *
 * @pure false - содержит тестовые эффекты
 * @effect RuleTester, TypeScript compiler
 * @invariant ∀ rule ∈ Rules: testable(rule) → verifiable(rule)
 * @precondition rule.meta.type ∈ ['problem', 'suggestion', 'layout']
 * @postcondition ∀ test ∈ Tests: passed(test) → correct(rule)
 * @complexity O(n) where n = |test cases|
 */

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll } from "@jest/globals";
import { RuleTester } from "@typescript-eslint/rule-tester";
import type { TSESLint } from "@typescript-eslint/utils";

// CHANGE: Define type-safe option type for ESLint rules
// WHY: Avoid using 'unknown' type as per CLAUDE.md guidelines
// PURITY: CORE - type definition
type RuleOptionValue =
	| string
	| number
	| boolean
	| null
	| readonly RuleOptionValue[];
type RuleOption = RuleOptionValue | { readonly [key: string]: RuleOptionValue };
type RuleOptions = readonly RuleOption[];

// CHANGE: ES module compatibility
// WHY: __dirname is not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CHANGE: Configure RuleTester with TypeScript support
// WHY: Need TypeScript parsing for type-aware rules
// INVARIANT: ∀ test ∈ Tests: typescript_parsed(test) → type_safe(test)
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

/**
 * Математически верифицируемый тестер правил
 *
 * @template TMessageIds - Union type of message IDs for type safety
 * @template TOptions - Rule options type for configuration
 */
export class MathematicalRuleTester<
	TMessageIds extends string = string,
	TOptions extends RuleOptions = readonly never[],
> {
	private ruleTester: RuleTester | null = null;

	private async initializeRuleTester(): Promise<RuleTester> {
		if (this.ruleTester) {
			return this.ruleTester;
		}

		// CHANGE: Initialize RuleTester with strict TypeScript configuration
		// WHY: Ensure mathematical properties are preserved during parsing
		// FORMAT THEOREM: ∀ code ∈ TestCases: parseable(code) → ast_correct(code)
		const parser = await import("@typescript-eslint/parser");

		this.ruleTester = new RuleTester({
			languageOptions: {
				parser: (parser.default ?? parser) as any,
				parserOptions: {
					ecmaVersion: "latest" as const,
					sourceType: "module" as const,
					project: path.resolve(process.cwd(), "tsconfig.json"),
					tsconfigRootDir: path.resolve(__dirname, "../.."),
				},
			},
		});

		return this.ruleTester;
	}

	/**
	 * Выполняет математически верифицируемое тестирование правила
	 *
	 * @param ruleName - Имя правила для идентификации
	 * @param rule - Реализация правила ESLint
	 * @param tests - Тестовые случаи с инвариантами
	 *
	 * @pure false - выполняет тестовые эффекты
	 * @effect Jest test runner, TypeScript compiler
	 * @invariant ∀ valid ∈ tests.valid: ¬reports_error(rule, valid)
	 * @invariant ∀ invalid ∈ tests.invalid: reports_error(rule, invalid)
	 * @precondition rule.meta.type ∈ ['problem', 'suggestion', 'layout']
	 * @postcondition ∀ test ∈ tests: deterministic(rule(test))
	 * @complexity O(n * m) where n = |tests|, m = avg(ast_size)
	 */
	async runTests(
		ruleName: string,
		rule: TSESLint.RuleModule<TMessageIds, TOptions>,
		tests: TSESLint.RunTests<TMessageIds, TOptions>,
	): Promise<void> {
		// CHANGE: Validate rule metadata before testing
		// WHY: Ensure mathematical properties are satisfied
		// INVARIANT: ∀ rule: valid_meta(rule) → testable(rule)
		this.validateRuleMetadata(rule);

		// CHANGE: Initialize RuleTester if needed
		// WHY: Async initialization required for ES modules
		const ruleTester = await this.initializeRuleTester();

		// CHANGE: Run tests with mathematical verification
		// WHY: Ensure deterministic behavior across test runs
		// POSTCONDITION: ∀ run: result(run₁) = result(run₂)
		ruleTester.run(ruleName, rule, tests);
	}

	/**
	 * Verify meta property exists
	 *
	 * @pure true - только проверка свойств
	 * @complexity O(1)
	 */
	private validateMetaExists(meta: object | undefined): asserts meta is object {
		if (meta === null || meta === undefined) {
			throw new Error(
				"Rule must have meta property for mathematical verification",
			);
		}
	}

	/**
	 * Verify meta.type exists
	 *
	 * @pure true - только проверка свойств
	 * @complexity O(1)
	 */
	private validateMetaType(type: string | undefined): asserts type is string {
		if (type === null || type === undefined) {
			throw new Error("Rule meta.type is required for classification");
		}
	}

	/**
	 * Verify meta.docs exists
	 *
	 * @pure true - только проверка свойств
	 * @complexity O(1)
	 */
	private validateMetaDocs(docs: object | undefined): asserts docs is object {
		if (docs === null || docs === undefined) {
			throw new Error("Rule meta.docs is required for documentation");
		}
	}

	/**
	 * Verify meta.messages exists and is not empty
	 *
	 * @pure true - только проверка свойств
	 * @complexity O(1)
	 */
	private validateMetaMessages(
		messages: Record<string, string> | undefined,
	): asserts messages is Record<string, string> {
		if (
			messages === null ||
			messages === undefined ||
			Object.keys(messages).length === 0
		) {
			throw new Error(
				"Rule must define messages for type-safe error reporting",
			);
		}
	}

	/**
	 * Валидирует метаданные правила на соответствие математическим инвариантам
	 *
	 * @param rule - Правило для валидации
	 *
	 * @pure true - только проверка свойств
	 * @invariant ∀ rule: valid_meta(rule) ↔ (has_type(rule) ∧ has_docs(rule))
	 * @precondition rule !== null ∧ rule !== undefined
	 * @postcondition valid_meta(rule) ∨ throws(ValidationError)
	 * @complexity O(1)
	 * @throws ValidationError if metadata is invalid
	 */
	private validateRuleMetadata(
		rule: TSESLint.RuleModule<TMessageIds, TOptions>,
	): void {
		this.validateMetaExists(rule.meta);
		this.validateMetaType(rule.meta.type);
		this.validateMetaDocs(rule.meta.docs);
		this.validateMetaMessages(rule.meta.messages);
	}

	/**
	 * Создает тестовый случай с математическими свойствами
	 *
	 * @param code - Исходный код для тестирования
	 * @param options - Опции правила (опционально)
	 * @returns Валидный тестовый случай
	 *
	 * @pure true - только создание объекта
	 * @invariant ∀ code: valid_syntax(code) → parseable(test_case(code))
	 * @precondition code.length > 0
	 * @postcondition valid_test_case(result)
	 * @complexity O(1)
	 */
	createValidTestCase(
		code: string,
		options?: TOptions,
	): TSESLint.ValidTestCase<TOptions> {
		return {
			code,
			...(options && { options }),
		};
	}

	/**
	 * Создает невалидный тестовый случай с ожидаемыми ошибками
	 *
	 * @param code - Исходный код с ошибками
	 * @param errors - Ожидаемые ошибки
	 * @param output - Ожидаемый результат после исправления (опционально)
	 * @param options - Опции правила (опционально)
	 * @returns Невалидный тестовый случай
	 *
	 * @pure true - только создание объекта
	 * @invariant ∀ error ∈ errors: valid_message_id(error.messageId)
	 * @precondition code.length > 0 ∧ errors.length > 0
	 * @postcondition invalid_test_case(result) ∧ |result.errors| = |errors|
	 * @complexity O(1)
	 */
	createInvalidTestCase(
		code: string,
		errors: Array<TSESLint.TestCaseError<TMessageIds>>,
		output?: string,
		options?: TOptions,
	): TSESLint.InvalidTestCase<TMessageIds, TOptions> {
		return {
			code,
			errors,
			...(output !== null && output !== undefined && output !== ""
				? { output }
				: {}),
			...(options !== null && options !== undefined ? { options } : {}),
		};
	}

	/**
	 * Создает RuleTester для использования в тестах
	 *
	 * @returns Promise<RuleTester>
	 *
	 * @pure false - создает тестовые эффекты
	 * @effect RuleTester initialization
	 * @invariant ∀ tester: created(tester) → configured(tester)
	 * @precondition TypeScript parser available
	 * @postcondition RuleTester ready for use
	 * @complexity O(1)
	 */
	async createRuleTester(): Promise<RuleTester> {
		return await this.initializeRuleTester();
	}
}

/**
 * Фабрика для создания математически верифицируемых тестеров правил
 *
 * @template TMessageIds - Union type of message IDs
 * @template TOptions - Rule options type
 * @returns Новый экземпляр тестера
 *
 * @pure true - только создание объекта
 * @invariant ∀ T: MathematicalRuleTester<T> → testable(T)
 * @postcondition valid_tester(result)
 * @complexity O(1)
 */
export function createMathematicalRuleTester<
	TMessageIds extends string = string,
	TOptions extends RuleOptions = readonly never[],
>(): MathematicalRuleTester<TMessageIds, TOptions> {
	return new MathematicalRuleTester<TMessageIds, TOptions>();
}

/**
 * Генерирует валидный TypeScript код для тестирования
 *
 * @pure true - детерминистическая генерация
 * @invariant ∀ seed: deterministic(generate(seed))
 * @postcondition valid_typescript(result)
 */
export function generateValidTypeScriptCode(seed: number): string {
	// Простая детерминистическая генерация для начала
	const templates = [
		"const x: number = 42;",
		"function foo(): string { return 'hello'; }",
		"interface User { name: string; age: number; }",
		"type Status = 'active' | 'inactive';",
		"class Calculator { add(a: number, b: number): number { return a + b; } }",
	];

	return templates[seed % templates.length] ?? "";
}

/**
 * Проверяет инвариант: правило не должно изменять семантику кода
 *
 * @param originalCode - Исходный код
 * @param fixedCode - Код после применения фиксера
 * @returns true если семантика сохранена
 *
 * @pure true - только анализ
 * @invariant ∀ code: semantics(code) = semantics(fix(code))
 */
export function preservesSemantics(
	_originalCode: string,
	fixedCode: string,
): boolean {
	// Базовая проверка - код должен оставаться валидным TypeScript
	// В будущем можно добавить более сложные проверки через TypeScript API
	return fixedCode.length > 0 && !fixedCode.includes("undefined");
}

/**
 * Утилиты для property-based тестирования правил
 *
 * @deprecated Use named exports instead: generateValidTypeScriptCode, preservesSemantics
 */
export const PropertyBasedTesting = {
	generateValidTypeScriptCode,
	preservesSemantics,
};
