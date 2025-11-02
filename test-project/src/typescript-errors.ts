// Test with real TypeScript compilation errors

interface User {
  name: string;
  age: number;
  email: string;
}

const user: User = {
  name: "John",
  age: 30,
  email: "john@example.com"
};

// This should trigger suggest-members because TypeScript knows the interface
user.badProperty; // Should suggest: name, age, email
user.getName(); // Should suggest methods if any

// Test with class
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
  
  subtract(a: number, b: number): number {
    return a - b;
  }
}

const calc = new Calculator();
calc.badMethod(1, 2); // Should suggest: add, subtract

console.log(user, calc);