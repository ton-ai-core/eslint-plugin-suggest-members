// CHANGE: Test plugin loading and rule registration
// WHY: Verify plugin can be loaded and rules are available
// PURITY: TEST (plugin loading verification)

import { describe, expect, it } from "@jest/globals";
import plugin from "../../src/index.js";

describe("plugin loading", () => {
	// CHANGE: Test plugin structure
	// WHY: Verify plugin exports correct structure
	it("should export plugin with correct structure", () => {
		expect(plugin).toBeDefined();
		expect(plugin.meta).toBeDefined();
		expect(plugin.rules).toBeDefined();
		expect(typeof plugin.rules).toBe("object");
	});

	// CHANGE: Test suggest-exports rule is available
	// WHY: Verify our new rule is properly exported
	it("should export suggest-exports rule", () => {
		expect(plugin.rules["suggest-exports"]).toBeDefined();
		expect(plugin.rules["suggest-exports"].meta).toBeDefined();
		expect(plugin.rules["suggest-exports"].create).toBeDefined();
		expect(typeof plugin.rules["suggest-exports"].create).toBe("function");
	});

	// CHANGE: Test rule metadata
	// WHY: Verify rule has correct ESLint metadata
	it("should have correct suggest-exports rule metadata", () => {
		const rule = plugin.rules["suggest-exports"];

		expect(rule.meta.type).toBe("problem");
		expect(rule.meta.docs).toBeDefined();
		expect(rule.meta.messages).toBeDefined();
		expect(rule.meta.schema).toBeDefined();

		// CHANGE: Verify message templates exist
		// WHY: ESLint needs message templates for error reporting
		expect(rule.meta.messages["suggestExports"]).toBeDefined();
		expect(typeof rule.meta.messages["suggestExports"]).toBe("string");
	});

	// CHANGE: Test all expected rules are present
	// WHY: Verify plugin completeness
	it("should export all expected rules", () => {
		const expectedRules = [
			"suggest-exports",
			"suggest-imports",
			"suggest-members",
			"suggest-module-paths",
		];

		expectedRules.forEach((ruleName) => {
			expect((plugin.rules as any)[ruleName]).toBeDefined();
			expect((plugin.rules as any)[ruleName].meta).toBeDefined();
			expect((plugin.rules as any)[ruleName].create).toBeDefined();
		});
	});

	// CHANGE: Test plugin metadata
	// WHY: Verify plugin has correct identification
	it("should have correct plugin metadata", () => {
		expect(plugin.meta.name).toBeDefined();
		expect(plugin.meta.version).toBeDefined();
		expect(typeof plugin.meta.name).toBe("string");
		expect(typeof plugin.meta.version).toBe("string");
	});
});
