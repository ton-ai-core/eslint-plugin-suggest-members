// CHANGE: Integration test for suggest-exports rule
// WHY: Verify rule works in real ESLint environment
// PURITY: TEST (integration testing)

import { describe, expect, it } from "@jest/globals";

describe("suggest-exports integration", () => {
	it("should export plugin structure", async () => {
		// CHANGE: Test plugin structure
		// WHY: Verify plugin exports expected structure
		const plugin = await import("../../dist/index.js");

		expect(plugin.rules).toBeDefined();
		expect(plugin.rules["suggest-exports"]).toBeDefined();
		expect(typeof plugin.rules["suggest-exports"].create).toBe("function");
	});

	it("should have correct rule metadata", async () => {
		// CHANGE: Test rule metadata
		// WHY: Verify rule has correct ESLint metadata
		const plugin = await import("../../dist/index.js");
		const rule = plugin.rules["suggest-exports"];

		expect(rule.meta).toBeDefined();
		expect(rule.meta.type).toBe("problem");
		expect(rule.meta.docs).toBeDefined();
		expect(rule.meta.messages).toBeDefined();
	});
});
