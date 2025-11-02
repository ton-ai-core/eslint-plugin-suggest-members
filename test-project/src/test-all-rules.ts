// Test file for all ESLint rules

// ============================================
// 1. suggest-module-paths - Module path typos
// ============================================
import { formatString } from "./utils/helpr"; // Typo in path: helpr -> helper
import { formatDate } from "./utils/formater"; // Typo in path: formater -> formatter

// ============================================
// 2. suggest-imports - Import name typos from node modules
// ============================================
import { readFileSynk } from "fs"; // Typo in import: readFileSynk -> readFileSync
import { readdirSynk } from "fs"; // Typo in import: readdirSynk -> readdirSync

// ============================================
// 3. suggest-exports - Export name typos from local files
// ============================================
import { formatStrin } from "./utils/helper"; // Typo in export: formatStrin -> formatString
import { calculat } from "./utils/helper"; // Typo in export: calculat -> calculate
import { formatDat } from "./utils/formatter"; // Typo in export: formatDat -> formatDate

// ============================================
// 4. suggest-members - Member access typos
// ============================================
const str = "test";
console.log(str.toUpperCas()); // Typo in member: toUpperCas -> toUpperCase
console.log(str.toLowerCas()); // Typo in member: toLowerCas -> toLowerCase

const arr = [1, 2, 3];
arr.pusj(4); // Typo in member: pusj -> push
arr.slise(0, 2); // Typo in member: slise -> slice
