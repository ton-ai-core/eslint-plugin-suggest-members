// Test file to verify type signatures in error messages

// Test 1: Import with typo - should show signature
import { readFileSynk } from "fs"; // Typo: readFileSynk -> readFileSync

// Test 2: Export with typo from local module
import { formatStrin } from "./test-project/src/utils/helper"; // Typo: formatStrin -> formatString

// Test 3: Member access typo
const str: string = "hello";
str.toUpperCas(); // Typo: toUpperCas -> toUpperCase

export {};
