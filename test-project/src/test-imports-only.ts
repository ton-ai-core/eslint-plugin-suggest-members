// Test only suggest-imports rule
// CHANGE: Test node module import typos
// WHY: Verify suggest-imports rule detects typos in Node.js module imports
// PURITY: SHELL - test file with imports

import { readFileSynk } from "fs"; // Should suggest: readFileSync
import { readdirSynk } from "fs"; // Should suggest: readdirSync
import { existsSynk } from "fs"; // Should suggest: existsSync
import { writeFileSynk } from "fs"; // Should suggest: writeFileSync

console.log(readFileSynk, readdirSynk, existsSynk, writeFileSynk);