// Test suggest-members rule - typos in member access

// Test 1: String methods
const str: string = "test";
str.toUpperCas(); // Typo: toUpperCas -> toUpperCase
str.toLowerCas(); // Typo: toLowerCas -> toLowerCase
str.subst(0, 2); // Typo: subst -> substr or substring

// Test 2: Array methods
const arr: number[] = [1, 2, 3];
arr.pusj(4); // Typo: pusj -> push
arr.slise(0, 2); // Typo: slise -> slice
arr.finde((x: number) => x > 1); // Typo: finde -> find

// Test 3: Object properties
interface User {
  name: string;
  age: number;
  email: string;
}

const user: User = { name: "John", age: 30, email: "john@example.com" };
console.log(user.nam); // Typo: nam -> name
console.log(user.ag); // Typo: ag -> age
console.log(user.emal); // Typo: emal -> email
