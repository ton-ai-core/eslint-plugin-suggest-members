// Simple test without explicit types
const obj = {
  name: "test",
  value: 42,
  getData() {
    return this.value;
  }
};

// This should trigger errors:
console.log(obj.nam); // Typo: nam -> name
console.log(obj.valu); // Typo: valu -> value
obj.getDat(); // Typo: getDat -> getData
