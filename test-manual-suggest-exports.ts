// CHANGE: Manual test file for suggest-exports rule
// WHY: Test rule with intentional typos
// This file should be processed by our rule

import { describe, expect, it } from "vitest";
import { readFile } from "fs";
import { join, resolve } from "path";

describe('manual test', () => {
	it('should work', () => {
		expect(true).toBe(true);
	});
});

void readFile("test.txt", () => {});
const fullPath = resolve(join("a", "b"));
