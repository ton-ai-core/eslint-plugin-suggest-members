// Test member access
const str = "hello";
str.nonExistentMethod(); // Should suggest existing string methods

const arr = [1, 2, 3];
arr.pus(4); // Should suggest "push"

console.log(str, arr);