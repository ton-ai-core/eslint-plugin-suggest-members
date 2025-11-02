// CHANGE: Debug test to understand why suggest-exports doesn't work
// WHY: Need to debug TypeScript service integration
// PURITY: SHELL - debug test file

// Try importing something that definitely doesn't exist
import { nonExistentFunction } from "./utils/helper";
import { anotherNonExistent } from "./utils/formatter";

console.log(nonExistentFunction, anotherNonExistent);