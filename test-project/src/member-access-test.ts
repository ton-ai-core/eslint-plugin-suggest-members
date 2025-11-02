// Test member access
const obj = {
  validProperty: "test",
  validMethod: () => "hello"
};

// These should trigger suggest-members
obj.invalidProperty; // Should suggest: validProperty, validMethod
obj.invalidMethod(); // Should suggest: validProperty, validMethod

console.log(obj);