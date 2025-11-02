// Comprehensive test for all ESLint rules
// CHANGE: Create comprehensive test to verify all suggest-members rules
// WHY: Need to validate that all typo detection rules are working correctly
// PURITY: SHELL - contains test code with potential side effects

// ============================================
// 1. suggest-module-paths - Module path typos
// ============================================
import { formatString } from "./utils/helpr"; // Should suggest: helper
import { formatDate } from "./utils/formater"; // Should suggest: formatter

// ============================================
// 2. suggest-imports - Import name typos from node modules
// ============================================
import { readFileSynk } from "fs"; // Should suggest: readFileSync
import { readdirSynk } from "fs"; // Should suggest: readdirSync
import { existsSynk } from "fs"; // Should suggest: existsSync

// ============================================
// 3. suggest-exports - Export name typos from local files
// ============================================
import { formatStrin } from "./utils/helper"; // Should suggest: formatString
import { calculat } from "./utils/helper"; // Should suggest: calculate

// ============================================
// 4. suggest-members - Member access typos
// ============================================
const testString = "Hello World";
console.log(testString.toUpperCas()); // Should suggest: toUpperCase
console.log(testString.toLowerCas()); // Should suggest: toLowerCase
console.log(testString.substrin(0, 5)); // Should suggest: substring

const testArray = [1, 2, 3];
testArray.pusj(4); // Should suggest: push
console.log(testArray.slise(0, 2)); // Should suggest: slice
console.log(testArray.includ(2)); // Should suggest: includes

const testObject = { name: "test" };
console.log(testObject.hasOwnPropert("name")); // Should suggest: hasOwnProperty

// Use imports to avoid unused variable warnings
console.log(formatString, formatDate, readFileSynk, readdirSynk, existsSynk, formatStrin, calculat);