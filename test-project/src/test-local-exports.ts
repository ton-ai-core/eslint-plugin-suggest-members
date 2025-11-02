// Test suggest-exports with local files
// CHANGE: Test typos in local module exports
// WHY: Verify suggest-exports rule works with local files
// PURITY: SHELL - test file

import { formatString } from "./utils/helper"; // Correct
import { formatStrin } from "./utils/helper"; // Typo: formatStrin -> formatString
import { calculate } from "./utils/helper"; // Correct  
import { calculat } from "./utils/helper"; // Typo: calculat -> calculate

console.log(formatString, formatStrin, calculate, calculat);