// CHANGE: Correct test for suggest-exports rule with actual exports
// WHY: Test with exports that actually exist in the files
// PURITY: SHELL - test file

// Test with actual exports from helper.ts: formatString, calculate
import { formatString } from "./utils/helper"; // Correct
import { formatStrin } from "./utils/helper"; // Typo: formatStrin -> formatString
import { calculate } from "./utils/helper"; // Correct
import { calculat } from "./utils/helper"; // Typo: calculat -> calculate

// Test with actual exports from formatter.ts: formatDate
import { formatDate } from "./utils/formatter"; // Correct
import { formatDat } from "./utils/formatter"; // Typo: formatDat -> formatDate

console.log(formatString, formatStrin, calculate, calculat, formatDate, formatDat);