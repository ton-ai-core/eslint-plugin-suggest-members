// Test file for member validation without import errors
const str = "test";
str.badMethod(); // Should trigger suggest-members - string doesn't have badMethod

const arr = [1, 2, 3];
arr.badArrayMethod(); // Should trigger suggest-members - array doesn't have badArrayMethod

const obj = { name: "test" };
obj.badProperty; // Should trigger suggest-members - object doesn't have badProperty

console.log(str, arr, obj);