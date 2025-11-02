// Test suggest-members with method calls
// CHANGE: Test typos in method calls
// WHY: Verify suggest-members rule works with member access
// PURITY: SHELL - test file with side effects

const str = "hello world";
str.toUpperCase(); // Correct
str.toUpperCas(); // Typo: missing 'e'

const arr = [1, 2, 3];
arr.push(4); // Correct
arr.pusj(5); // Typo: pusj -> push

console.log("Test completed");