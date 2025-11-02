// Debug file to test if TypeScript parser is working
import { nonExistent } from "./utils/helper"; // Should trigger suggest-exports

const str = "test";
str.badMethod(); // Should trigger suggest-members - string doesn't have badMethod

const arr = [1, 2, 3];
arr.badArrayMethod(); // Should trigger suggest-members - array doesn't have badArrayMethod

console.log(nonExistent, str, arr);