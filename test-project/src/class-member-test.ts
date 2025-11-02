// Test with explicit class
class TestClass {
  public name: string = "test";
  public getValue(): number {
    return 42;
  }
}

const instance = new TestClass();
instance.invalidProperty; // Should suggest: name, getValue
instance.invalidMethod(); // Should suggest: name, getValue

console.log(instance);