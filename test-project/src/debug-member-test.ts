// Debug test for member validation
console.log("=== DEBUG MEMBER TEST ===");

// Simple object literal
const obj = { name: "test", value: 42 };
console.log("Testing obj.invalidProperty...");
obj.invalidProperty; // This should trigger suggest-members

console.log("Testing obj.invalidMethod()...");
obj.invalidMethod(); // This should trigger suggest-members

// String literal
const str = "hello";
console.log("Testing str.invalidMethod()...");
str.invalidMethod(); // This should trigger suggest-members

console.log("=== END DEBUG TEST ===");