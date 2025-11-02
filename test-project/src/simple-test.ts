// Simple test without external dependencies

// Test suggest-members
const str = "hello world";
str.badMethod(); // Should suggest string methods

const arr = [1, 2, 3];
arr.badArrayMethod(); // Should suggest array methods

const obj = { name: "test", age: 25 };
obj.badProperty; // Should suggest name, age

console.log(str, arr, obj);