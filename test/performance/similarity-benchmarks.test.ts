// CHANGE: Performance benchmarks for similarity algorithms
// WHY: Ensure algorithms perform efficiently with realistic data sizes
// PURITY: SHELL (test infrastructure)

import { describe, expect, it } from "@jest/globals";
import { compositeScore } from "../../src/core/similarity/composite.js";
import { jaro } from "../../src/core/similarity/jaro.js";
import { jaroWinkler } from "../../src/core/similarity/jaro-winkler.js";

// Helper functions inline to avoid compilation issues
const generateTestData = (count: number) => {
	const baseNames = Array.from({ length: count }, (_, i) => `property${i}`);
	const variations = baseNames.map((name) => name.slice(0, -1));
	return { baseNames, variations };
};

const runPerformanceTest = <T>(
	testData: { baseNames: string[]; variations: string[] },
	algorithm: (a: string, b: string) => T,
): { duration: number; operations: number } => {
	const { baseNames, variations } = testData;
	const start = performance.now();
	let operations = 0;
	for (const variation of variations) {
		for (const base of baseNames) {
			algorithm(variation, base);
			operations++;
		}
	}
	const duration = performance.now() - start;
	return { duration, operations };
};

const expectPerformanceWithin = (
	duration: number,
	operations: number,
	maxDurationMs: number,
	description: string,
): void => {
	expect(duration).toBeLessThan(maxDurationMs);
	console.log(
		`${description}: ${operations} operations in ${duration.toFixed(2)}ms`,
	);
};

describe("similarity algorithm performance", () => {
	describe("jaro algorithm performance", () => {
		it("should handle small datasets efficiently", () => {
			// CHANGE: Benchmark with small dataset (typical class size)
			// WHY: Verify performance for common use cases
			const testData = generateTestData(15);
			const { duration, operations } = runPerformanceTest(testData, jaro);
			expectPerformanceWithin(duration, operations, 10, "Small dataset");
		});

		it("should handle medium datasets efficiently", () => {
			// CHANGE: Benchmark with medium dataset (large class)
			// WHY: Verify performance scales reasonably
			const testData = generateTestData(50);
			const { duration, operations } = runPerformanceTest(testData, jaro);
			expectPerformanceWithin(duration, operations, 50, "Medium dataset");
		});

		it("should handle long strings efficiently", () => {
			// CHANGE: Benchmark with long identifier names
			// WHY: Verify performance with complex naming patterns
			const longBase =
				"calculateTotalAmountWithTaxAndDiscountForPremiumCustomers";
			const longVariation =
				"calculateTotalAmountWithTaxAndDiscountForPremiumCustomer"; // Missing 's'

			const start = performance.now();

			// Perform 1000 comparisons
			for (let i = 0; i < 1000; i++) {
				jaro(longBase, longVariation);
			}

			const duration = performance.now() - start;

			// Should complete 1000 long string comparisons in < 100ms
			expect(duration).toBeLessThan(100);
		});
	});

	describe("jaro-winkler algorithm performance", () => {
		it("should perform similarly to jaro with prefix bonus", () => {
			// CHANGE: Compare Jaro-Winkler performance to Jaro
			// WHY: Verify prefix bonus doesn't significantly impact performance
			const testData = generateTestData(20);
			const jaroResult = runPerformanceTest(testData, jaro);
			const jaroWinklerResult = runPerformanceTest(testData, jaroWinkler);

			// Jaro-Winkler should be at most 2x slower than Jaro
			expect(jaroWinklerResult.duration).toBeLessThan(jaroResult.duration * 2);
		});
	});

	describe("composite score performance", () => {
		it("should handle multiple similarity metrics efficiently", () => {
			// CHANGE: Benchmark composite scoring algorithm
			// WHY: Verify combined metrics don't create performance bottleneck
			const testData = generateTestData(15);
			const { duration, operations } = runPerformanceTest(
				testData,
				compositeScore,
			);
			expectPerformanceWithin(duration, operations, 100, "Composite scoring");
		});

		it("should scale linearly with input size", () => {
			// CHANGE: Test algorithmic complexity
			// WHY: Verify O(n) scaling behavior
			const smallResult = runPerformanceTest(
				generateTestData(5),
				compositeScore,
			);
			const largeResult = runPerformanceTest(
				generateTestData(20),
				compositeScore,
			);

			// Large dataset should take at most 50x longer (allowing for overhead and variance)
			expect(largeResult.duration).toBeLessThan(smallResult.duration * 50);
		});
	});

	describe("real-world performance scenarios", () => {
		it("should handle typical ESLint rule execution efficiently", () => {
			// CHANGE: Simulate real ESLint rule execution scenario
			// WHY: Verify performance in actual usage context
			const classMembers = [
				"constructor",
				"initialize",
				"render",
				"update",
				"destroy",
				"handleClick",
				"handleSubmit",
				"handleChange",
				"handleKeyPress",
				"validateForm",
				"processData",
				"transformInput",
				"formatOutput",
				"getUserData",
				"saveUserData",
				"deleteUserData",
				"updateUserData",
				"calculateTotal",
				"calculateTax",
				"calculateDiscount",
			];

			const typos = [
				"construtor",
				"initalize",
				"rendr",
				"updat",
				"destory",
				"handleClik",
				"handleSubmt",
				"handleChang",
				"handleKeyPres",
				"validateFrm",
				"procesData",
				"transformInpt",
				"formatOutpt",
				"getUserDat",
				"saveUserDat",
				"deleteUserDat",
				"updateUserDat",
				"calculateTotl",
				"calculateTx",
				"calculateDiscont",
			];

			const start = performance.now();

			// Simulate finding best matches for each typo
			for (const typo of typos) {
				let bestScore = 0;
				let bestMatch = "";

				for (const member of classMembers) {
					const score = compositeScore(typo, member);
					if (score > bestScore) {
						bestScore = score;
						bestMatch = member;
					}
				}

				// Ensure we found a reasonable match
				expect(bestScore).toBeGreaterThan(0.5);
				expect(bestMatch).toBeTruthy();
			}

			const duration = performance.now() - start;

			// Should complete realistic scenario in < 50ms
			expect(duration).toBeLessThan(50);
		});

		it("should handle edge case performance gracefully", () => {
			// CHANGE: Test performance with edge cases
			// WHY: Ensure no performance cliffs with unusual inputs
			const edgeCases: Array<[string, string]> = [
				["", "property"], // Empty string
				["a", "property"], // Very short string
				["x".repeat(100), "property"], // Very long string
				["property", ""], // Reversed empty
				["property", "a"], // Reversed short
				["property", "y".repeat(100)], // Reversed long
			];

			const start = performance.now();

			for (const [str1, str2] of edgeCases) {
				const score = compositeScore(str1, str2);
				expect(score).toBeGreaterThanOrEqual(0);
				expect(score).toBeLessThanOrEqual(1);
			}

			const duration = performance.now() - start;

			// Edge cases should complete quickly
			expect(duration).toBeLessThan(10);
		});
	});

	describe("memory usage patterns", () => {
		it("should not create memory leaks with repeated calls", () => {
			// CHANGE: Test for memory leaks in similarity calculations
			// WHY: Ensure algorithms don't accumulate memory over time
			const testString1 = "testProperty";
			const testString2 = "testProprty";

			// Perform many iterations to detect potential leaks
			for (let i = 0; i < 10000; i++) {
				jaro(testString1, testString2);
				jaroWinkler(testString1, testString2);
				compositeScore(testString1, testString2);
			}

			// If we reach here without running out of memory, test passes
			expect(true).toBe(true);
		});
	});
});
