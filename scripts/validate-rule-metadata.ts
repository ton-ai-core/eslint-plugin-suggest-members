#!/usr/bin/env npx ts-node

/**
 * Скрипт для валидации метаданных правил ESLint с математическими инвариантами
 * 
 * @pure false - читает файловую систему и выводит результаты
 * @effect File system, console output
 * @invariant ∀ rule ∈ Rules: valid_metadata(rule) ∨ report_error(rule)
 * @precondition src/rules directory exists
 * @postcondition ∀ rule: validated(rule.meta) ∨ error_reported(rule)
 * @complexity O(n) where n = |rules|
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { TSESLint } from "@typescript-eslint/utils";

// CHANGE: Get current directory for ES modules
// WHY: ES modules don't have __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Интерфейс для результата валидации правила
 */
interface RuleValidationResult {
	readonly ruleName: string;
	readonly isValid: boolean;
	readonly errors: readonly string[];
	readonly warnings: readonly string[];
}

/**
 * Проверяет базовые инварианты метаданных правила
 * 
 * @param rule - Правило для проверки
 * @returns Результат валидации
 * 
 * @pure true - только анализ данных
 * @invariant ∀ rule: valid_meta(rule) ↔ (has_type(rule) ∧ has_docs(rule) ∧ has_messages(rule))
 * @precondition rule !== null ∧ rule !== undefined
 * @postcondition valid_result(result) ∧ (result.isValid ↔ valid_meta(rule))
 * @complexity O(1)
 */
function validateBasicInvariants(
	rule: TSESLint.RuleModule<string, readonly unknown[]>,
	ruleName: string
): RuleValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// CHANGE: Verify meta property exists
		// WHY: All rules must have metadata for mathematical verification
		if (!rule.meta) {
			errors.push("Rule must have meta property");
			return { ruleName, isValid: false, errors, warnings };
		}

		// CHANGE: Verify required meta properties
		// WHY: Mathematical specification requires complete metadata
		if (!rule.meta.type) {
			errors.push("Rule meta.type is required (must be 'problem', 'suggestion', or 'layout')");
		} else if (!["problem", "suggestion", "layout"].includes(rule.meta.type)) {
			errors.push(`Invalid rule type: ${rule.meta.type}`);
		}

		if (!rule.meta.docs) {
			errors.push("Rule meta.docs is required for documentation");
		} else {
			// CHANGE: Verify docs properties
			// WHY: Documentation is part of mathematical specification
			if (!rule.meta.docs.description) {
				warnings.push("Rule docs should have description");
			}
			if (!rule.meta.docs.url) {
				warnings.push("Rule docs should have URL");
			}
		}

		if (!rule.meta.messages || Object.keys(rule.meta.messages).length === 0) {
			errors.push("Rule must define messages for type-safe error reporting");
		} else {
			// CHANGE: Verify message format
			// WHY: Error messages must follow mathematical format
			Object.entries(rule.meta.messages).forEach(([messageId, message]) => {
				if (typeof message !== "string" || message.length === 0) {
					errors.push(`Message '${messageId}' must be a non-empty string`);
				}
				if (!message.match(/^[A-Z].*\.$/)) {
					warnings.push(`Message '${messageId}' should start with capital letter and end with period`);
				}
			});
		}

		// CHANGE: Verify create function
		// WHY: Rule implementation must be callable
		if (!rule.create || typeof rule.create !== "function") {
			errors.push("Rule must have create function");
		} else if (rule.create.length !== 1) {
			warnings.push("Rule create function should accept exactly one parameter (context)");
		}

		return {
			ruleName,
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

/**
 * Проверяет инварианты схемы опций правила
 * 
 * @param rule - Правило для проверки
 * @returns Дополнительные ошибки валидации
 * 
 * @pure true - только анализ схемы
 * @invariant ∀ schema: valid_schema(schema) → parseable_options(schema)
 * @complexity O(1)
 */
function validateSchemaInvariants(
	rule: TSESLint.RuleModule<string, readonly unknown[]>
): readonly string[] {
		const errors: string[] = [];

		if (rule.meta?.schema) {
			// CHANGE: Verify schema is valid JSON Schema
			// WHY: Options must be mathematically verifiable
			try {
				if (Array.isArray(rule.meta.schema)) {
					// Schema array format
					rule.meta.schema.forEach((schema, index) => {
						if (typeof schema !== "object" || schema === null) {
							errors.push(`Schema at index ${index} must be an object`);
						}
					});
				} else if (typeof rule.meta.schema === "object" && rule.meta.schema !== null) {
					// Single schema object format
					if (!rule.meta.schema.type && !rule.meta.schema.properties && !rule.meta.schema.items) {
						errors.push("Schema should define type, properties, or items");
					}
				} else {
					errors.push("Schema must be an object or array of objects");
				}
			} catch (error) {
				errors.push(`Invalid schema: ${error}`);
			}
		}

		return errors;
	}

/**
 * Проверяет инварианты фиксеров правила
 * 
 * @param rule - Правило для проверки
 * @returns Предупреждения о фиксерах
 * 
 * @pure true - только анализ метаданных
 * @invariant ∀ fixer: safe_fixer(fixer) → preserves_semantics(fixer)
 * @complexity O(1)
 */
function validateFixerInvariants(
	rule: TSESLint.RuleModule<string, readonly unknown[]>
): readonly string[] {
		const warnings: string[] = [];

		// CHANGE: Check if rule claims to be fixable
		// WHY: Fixable rules must preserve program semantics
		if (rule.meta?.fixable) {
			if (!["code", "whitespace"].includes(rule.meta.fixable)) {
				warnings.push(`Invalid fixable type: ${rule.meta.fixable}`);
			}
		}

		// CHANGE: Check for suggestions
		// WHY: Suggestions are alternative to automatic fixes
		if (rule.meta?.hasSuggestions) {
			if (typeof rule.meta.hasSuggestions !== "boolean") {
				warnings.push("hasSuggestions must be a boolean");
			}
		}

		return warnings;
	}

/**
 * Валидирует все правила в директории
 * 
 * @param rulesDir - Путь к директории с правилами
 * @returns Результаты валидации всех правил
 * 
 * @pure false - читает файловую систему
 * @effect File system access
 * @invariant ∀ rule ∈ rules_directory: validated(rule) ∨ error_reported(rule)
 * @complexity O(n) where n = |rules|
 */
async function validateAllRules(rulesDir: string): Promise<readonly RuleValidationResult[]> {
	const results: RuleValidationResult[] = [];

	try {
		// CHANGE: Check if dist directory exists, otherwise use src
		// WHY: Support both development and built scenarios
		const distRulesDir = rulesDir.replace('/src/', '/dist/');
		const useDistDir = fs.existsSync(distRulesDir);
		const actualRulesDir = useDistDir ? distRulesDir : rulesDir;
		const fileExtension = useDistDir ? "index.js" : "index.ts";
		
		console.log(`Using rules directory: ${actualRulesDir} (${fileExtension})`);
		
		// CHANGE: Read rules directory
		// WHY: Need to discover all rule files
		const entries = fs.readdirSync(actualRulesDir, { withFileTypes: true });
		
		for (const entry of entries) {
			if (entry.isDirectory()) {
				const rulePath = path.join(actualRulesDir, entry.name, fileExtension);
				
				if (fs.existsSync(rulePath)) {
					try {
						// CHANGE: Dynamic import of rule module
						// WHY: Need to load rule for validation
						const ruleModule = await import(path.resolve(rulePath));
						const rule = ruleModule.default || ruleModule[entry.name + "Rule"];
						
						if (rule) {
							// CHANGE: Validate rule with mathematical invariants
							// WHY: Ensure rule meets formal specification
							const basicResult = validateBasicInvariants(rule, entry.name);
							const schemaErrors = validateSchemaInvariants(rule);
							const fixerWarnings = validateFixerInvariants(rule);
							
							results.push({
								...basicResult,
								errors: [...basicResult.errors, ...schemaErrors],
								warnings: [...basicResult.warnings, ...fixerWarnings],
							});
						} else {
							results.push({
								ruleName: entry.name,
								isValid: false,
								errors: [`Could not find rule export in ${rulePath}`],
								warnings: [],
							});
						}
					} catch (error) {
						results.push({
							ruleName: entry.name,
							isValid: false,
							errors: [`Failed to load rule: ${error}`],
							warnings: [],
						});
					}
				} else {
					results.push({
						ruleName: entry.name,
						isValid: false,
						errors: [`Rule file not found: ${rulePath}`],
						warnings: [],
					});
				}
			}
		}
	} catch (error) {
		console.error(`Failed to read rules directory: ${error}`);
		process.exit(1);
	}

	return results;
}

/**
 * Генерирует отчет о валидации правил
 * 
 * @param results - Результаты валидации
 * 
 * @pure false - выводит в консоль
 * @effect Console output
 * @postcondition ∀ result ∈ results: reported(result)
 * @complexity O(n) where n = |results|
 */
function generateValidationReport(results: readonly RuleValidationResult[]): void {
	console.log("🔍 ESLint Rules Metadata Validation Report");
	console.log("=" .repeat(50));
	
	const validRules = results.filter(r => r.isValid);
	const invalidRules = results.filter(r => !r.isValid);
	
	console.log(`\n📊 Summary:`);
	console.log(`   ✅ Valid rules: ${validRules.length}`);
	console.log(`   ❌ Invalid rules: ${invalidRules.length}`);
	console.log(`   📝 Total rules: ${results.length}`);
	
	if (invalidRules.length > 0) {
		console.log(`\n❌ Invalid Rules:`);
		invalidRules.forEach(rule => {
			console.log(`\n   Rule: ${rule.ruleName}`);
			rule.errors.forEach(error => {
				console.log(`     🚨 Error: ${error}`);
			});
			rule.warnings.forEach(warning => {
				console.log(`     ⚠️  Warning: ${warning}`);
			});
		});
	}
	
	if (validRules.length > 0) {
		console.log(`\n✅ Valid Rules:`);
		validRules.forEach(rule => {
			console.log(`   ${rule.ruleName}`);
			if (rule.warnings.length > 0) {
				rule.warnings.forEach(warning => {
					console.log(`     ⚠️  Warning: ${warning}`);
				});
			}
		});
	}
	
	// CHANGE: Mathematical verification summary
	// WHY: Provide formal verification status
	console.log(`\n🧮 Mathematical Verification:`);
	console.log(`   Invariant satisfaction: ${(validRules.length / results.length * 100).toFixed(1)}%`);
	console.log(`   Formal specification compliance: ${invalidRules.length === 0 ? "✅ PASSED" : "❌ FAILED"}`);
}

/**
 * Главная функция скрипта
 */
async function main(): Promise<void> {
	const rulesDir = path.resolve(__dirname, "../src/rules");
	
	console.log(`Validating rules in: ${rulesDir}`);
	
	const results = await validateAllRules(rulesDir);
	generateValidationReport(results);
	
	// CHANGE: Exit with error code if validation failed
	// WHY: CI/CD should fail on invalid rules
	const hasErrors = results.some(r => !r.isValid);
	if (hasErrors) {
		console.log(`\n💥 Validation failed! Fix the errors above.`);
		process.exit(1);
	} else {
		console.log(`\n🎉 All rules pass mathematical verification!`);
		process.exit(0);
	}
}

// CHANGE: Run main function with error handling
// WHY: Provide clear error messages for debugging
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(error => {
		console.error("Script execution failed:", error);
		process.exit(1);
	});
}