/**
 * Example 1: Simple Typos Detection
 * 
 * This example tests the plugin's ability to detect simple typos in property 
 * and method names, such as missing or transposed letters.
 */

class TestClass {
  property = 123;
  counter = 0;
  getCounter() {
    return this.counter;
  }
  processData(data: string) {
    return data.toUpperCase();
  }
}

const test1 = new TestClass();

// Correct usage
test1.property;
test1.counter;
test1.getCounter();
test1.processData("test");

// Typo errors - missing letter
test1.proprty; // Should suggest "property"
test1.couner; // Should suggest "counter"
test1.getCouner(); // Should suggest "getCounter"

// Typo errors - extra letter
test1.propertyy; // Should suggest "property"
test1.counterr; // Should suggest "counter"

// Typo errors - transposed letters
test1.propreyt; // Should suggest "property"
test1.conuter; // Should suggest "counter"
test1.porcessData("test"); // Should suggest "processData" 