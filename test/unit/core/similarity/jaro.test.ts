// CHANGE: Unit tests for Jaro similarity algorithm
// WHY: Ensure mathematical correctness of similarity calculations
// PURITY: SHELL (test infrastructure)

import { describe, expect, it } from "vitest";
import { jaro } from "../../../../src/core/similarity/jaro.js";

describe("jaro similarity algorithm", () => {
	describe("identical strings", () => {
		it("should return 1.0 for identical strings", () => {
			// CHANGE: Test mathematical property: jaro(s, s) = 1.0
			// WHY: Verify identity property of similarity function
			expect(jaro("hello", "hello")).toBe(1.0);
			expect(jaro("test", "test")).toBe(1.0);
			expect(jaro("", "")).toBe(1.0);
		});
	});

	describe("completely different strings", () => {
		it("should return 0.0 for completely different strings", () => {
			// CHANGE: Test mathematical property: jaro(s1, s2) = 0 when no common chars
			// WHY: Verify zero similarity for disjoint strings
			expect(jaro("abc", "xyz")).toBe(0.0);
			expect(jaro("hello", "12345")).toBe(0.0);
		});
	});

	describe("empty strings", () => {
		it("should handle empty strings correctly", () => {
			// CHANGE: Test edge case handling
			// WHY: Ensure robust behavior with empty inputs
			expect(jaro("", "hello")).toBe(0.0);
			expect(jaro("hello", "")).toBe(0.0);
			expect(jaro("", "")).toBe(1.0);
		});
	});

	describe("transpositions", () => {
		it("should detect transpositions correctly", () => {
			// CHANGE: Test transposition detection
			// WHY: Verify Jaro algorithm handles character swaps
			const result = jaro("martha", "marhta");
			expect(result).toBeGreaterThan(0.9);
			expect(result).toBeLessThan(1.0);
		});

		it("should handle multiple transpositions", () => {
			// CHANGE: Test complex transposition patterns
			// WHY: Verify algorithm robustness with multiple swaps
			const result = jaro("dwayne", "duane");
			expect(result).toBeGreaterThan(0.8);
		});
	});

	describe("property names similarity", () => {
		it("should detect typos in property names", () => {
			// CHANGE: Test real-world property name similarities
			// WHY: Verify algorithm works for JavaScript/TypeScript identifiers
			expect(jaro("property", "proprty")).toBeGreaterThan(0.9);
			expect(jaro("counter", "couner")).toBeGreaterThan(0.9);
			expect(jaro("getCounter", "getCouner")).toBeGreaterThan(0.9);
		});

		it("should detect method name similarities", () => {
			// CHANGE: Test method name similarity detection
			// WHY: Verify algorithm works for camelCase method names
			expect(jaro("processData", "procesData")).toBeGreaterThan(0.95);
			expect(jaro("getFullName", "getFullNam")).toBeGreaterThan(0.9);
			expect(jaro("fetchUserData", "fetchUsrData")).toBeGreaterThan(0.9);
		});
	});

	describe("mathematical properties", () => {
		it("should be symmetric", () => {
			// CHANGE: Test mathematical property: jaro(s1, s2) = jaro(s2, s1)
			// WHY: Verify symmetry property of similarity function
			const s1 = "hello";
			const s2 = "helo";
			expect(jaro(s1, s2)).toBe(jaro(s2, s1));
		});

		it("should return values between 0 and 1", () => {
			// CHANGE: Test mathematical property: 0 ≤ jaro(s1, s2) ≤ 1
			// WHY: Verify similarity function bounds
			const testCases: Array<[string, string]> = [
				["hello", "world"],
				["test", "best"],
				["abc", "def"],
				["similar", "simlar"],
			];

			testCases.forEach(([s1, s2]: [string, string]) => {
				const result = jaro(s1, s2);
				expect(result).toBeGreaterThanOrEqual(0.0);
				expect(result).toBeLessThanOrEqual(1.0);
			});
		});
	});

	describe("performance edge cases", () => {
		it("should handle long strings efficiently", () => {
			// CHANGE: Test performance with long strings
			// WHY: Ensure algorithm scales reasonably
			const longString1 = "a".repeat(1000);
			const longString2 = `${"a".repeat(999)}b`;

			const start = Date.now();
			const result = jaro(longString1, longString2);
			const duration = Date.now() - start;

			expect(result).toBeGreaterThan(0.9);
			expect(duration).toBeLessThan(100); // Should complete in < 100ms
		});
	});
});
