// Test with built-in types that TypeScript definitely knows
const str: string = "hello";
str.invalidMethod(); // Should suggest string methods

const num: number = 42;
num.invalidProperty; // Should suggest number methods

const arr: number[] = [1, 2, 3];
arr.invalidArrayMethod(); // Should suggest array methods

console.log(str, num, arr);