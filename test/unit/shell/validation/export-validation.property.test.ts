// CHANGE: Property-based tests for export validation
// WHY: Verify mathematical invariants hold for all inputs
// PURITY: TEST (property-based testing)
// REF: FUNCTIONAL_ARCHITECTURE.md - Property-based testing

import { describe, it } from "@jest/globals";
import * as fc from "fast-check";
import { makeSimilarityScore } from "../../../../src/core/types/domain-types.js";
import type { ExportValidationResult } from "../../../../src/core/types/validation-types.js";
import {
	formatExportValidationMessage,
	isValidExportCandidate,
} from "../../../../src/shell/validation/export-validation-effect.js";

// CHANGE: Arbitraries for property-based testing
// WHY: Generate random inputs for comprehensive testing

const validIdentifierArbitrary = fc
	.string({
		minLength: 1,
		maxLength: 50,
	})
	.filter((s) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(s));

const exportNameArbitrary = fc.oneof(
	validIdentifierArbitrary,
	fc.string({ minLength: 0, maxLength: 20 }),
);

const modulePathArbitrary = fc.oneof(
	fc.constant("react"),
	fc.constant("fs"),
	fc.constant("./module"),
	fc.constant("@angular/core"),
	fc.string({ minLength: 1, maxLength: 30 }),
);

describe("export validation property tests", () => {
	describe("isValidExportCandidate", () => {
		// CHANGE: Test reflexivity property
		// WHY: Verify function is deterministic
		it("should be deterministic", () => {
			fc.assert(
				fc.property(
					exportNameArbitrary,
					exportNameArbitrary,
					(candidate, userInput) => {
						const result1 = isValidExportCandidate(candidate, userInput);
						const result2 = isValidExportCandidate(candidate, userInput);
						return result1 === result2;
					},
				),
			);
		});

		// CHANGE: Test private export rejection
		// WHY: Private exports should always be rejected
		it("should reject private exports (starting with _)", () => {
			fc.assert(
				fc.property(
					fc.string({ minLength: 1 }).map((s) => "_" + s),
					exportNameArbitrary,
					(candidate, userInput) =>
						!isValidExportCandidate(candidate, userInput),
				),
			);
		});

		// CHANGE: Test exact match rejection
		// WHY: Exact matches should be rejected (already found)
		it("should reject exact matches", () => {
			fc.assert(
				fc.property(
					validIdentifierArbitrary,
					(name) => !isValidExportCandidate(name, name),
				),
			);
		});

		// CHANGE: Test empty string rejection
		// WHY: Empty strings should always be rejected
		it("should reject empty candidates", () => {
			fc.assert(
				fc.property(
					exportNameArbitrary,
					(userInput) => !isValidExportCandidate("", userInput),
				),
			);
		});

		// CHANGE: Test internal symbol rejection
		// WHY: Internal symbols should be rejected
		it("should reject internal TypeScript symbols (starting with __)", () => {
			fc.assert(
				fc.property(
					fc.string({ minLength: 1 }).map((s) => "__" + s),
					exportNameArbitrary,
					(candidate, userInput) =>
						!isValidExportCandidate(candidate, userInput),
				),
			);
		});

		// CHANGE: Test default export rejection in named context
		// WHY: Default exports should be rejected for named imports
		it("should reject 'default' export", () => {
			fc.assert(
				fc.property(
					exportNameArbitrary,
					(userInput) => !isValidExportCandidate("default", userInput),
				),
			);
		});

		// CHANGE: Test valid candidate acceptance
		// WHY: Valid candidates should be accepted
		it("should accept valid candidates", () => {
			fc.assert(
				fc.property(
					validIdentifierArbitrary,
					validIdentifierArbitrary,
					(candidate, userInput) => {
						// Skip cases that should be rejected
						fc.pre(candidate !== userInput);
						fc.pre(!candidate.startsWith("_"));
						fc.pre(!candidate.startsWith("__"));
						fc.pre(candidate !== "default");
						fc.pre(candidate.length > 0);

						return isValidExportCandidate(candidate, userInput);
					},
				),
			);
		});
	});

	describe("formatExportValidationMessage", () => {
		// CHANGE: Test message formatting determinism
		// WHY: Formatting should be deterministic
		it("should format messages deterministically", () => {
			const validResult: ExportValidationResult = { _tag: "Valid" };

			const message1 = formatExportValidationMessage(validResult);
			const message2 = formatExportValidationMessage(validResult);

			expect(message1).toBe(message2);
		});

		// CHANGE: Test valid result formatting
		// WHY: Valid results should return empty string
		it("should return empty string for valid results", () => {
			const validResult: ExportValidationResult = { _tag: "Valid" };
			const message = formatExportValidationMessage(validResult);
			expect(message).toBe("");
		});

		// CHANGE: Test export not found formatting
		// WHY: Export not found should contain export name and module
		it("should format export not found messages", () => {
			fc.assert(
				fc.property(
					exportNameArbitrary,
					modulePathArbitrary,
					(exportName, modulePath) => {
						const result: ExportValidationResult = {
							_tag: "ExportNotFound",
							exportName,
							modulePath,
							suggestions: [],
							node: {},
						};

						const message = formatExportValidationMessage(result);

						// Message should contain export name and module path
						return (
							message.includes(exportName) &&
							message.includes(modulePath) &&
							message.includes("Cannot find export")
						);
					},
				),
			);
		});

		// CHANGE: Test suggestions inclusion
		// WHY: Messages with suggestions should include them
		it("should include suggestions when available", () => {
			const result: ExportValidationResult = {
				_tag: "ExportNotFound",
				exportName: "useStae",
				modulePath: "react",
				suggestions: [
					{ name: "useState", score: makeSimilarityScore(0.9) },
					{ name: "useState", score: makeSimilarityScore(0.8) },
				],
				node: {},
			};

			const message = formatExportValidationMessage(result);

			expect(message).toContain("Did you mean:");
			expect(message).toContain("useState");
			expect(message).toContain("useState");
		});
	});

	// CHANGE: Integration property tests
	// WHY: Test composition of functions
	describe("function composition", () => {
		it("should maintain consistency between validation and formatting", () => {
			// INVARIANT: ∀result: format(result) ≠ "" ⟺ result._tag ≠ "Valid"
			// This tests that only invalid results produce non-empty messages

			fc.assert(
				fc.property(
					exportNameArbitrary,
					modulePathArbitrary,
					(exportName, modulePath) => {
						const validResult: ExportValidationResult = { _tag: "Valid" };
						const invalidResult: ExportValidationResult = {
							_tag: "ExportNotFound",
							exportName,
							modulePath,
							suggestions: [],
							node: {},
						};

						const validMessage = formatExportValidationMessage(validResult);
						const invalidMessage = formatExportValidationMessage(invalidResult);

						return validMessage === "" && invalidMessage !== "";
					},
				),
			);
		});
	});
});
