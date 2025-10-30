// CHANGE: Manual test file for suggest-exports rule
// WHY: Test rule with intentional typos
// This file should be processed by our rule

import { describe, it, expec } from '@jest/globals';
import { readFil, writeFile } from 'fs';
import { resolv, join } from 'path';

describe('manual test', () => {
	it('should work', () => {
		expec(true).toBe(true);
	});
});

readFil('test.txt', () => {});
const fullPath = resolv(join('a', 'b'));