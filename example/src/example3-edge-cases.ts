/**
 * Example 3: Edge Cases and Complex Comparisons
 * 
 * This example tests the plugin's behavior with:
 * - Very short property names
 * - Complex naming patterns
 * - Multiple potential matches with similar scores
 */

class ComplexAPI {
  // Short names
  id = 1;
  ip = "127.0.0.1";
  ui = "default";
  
  // Similar methods with different prefixes
  initializeData() { return {}; }
  initializeUser() { return {}; }
  initializeConfig() { return {}; }
  
  // Methods with numbers
  process1() { return {}; }
  process2() { return {}; }
  process3() { return {}; }
  
  // Complex naming patterns
  calculateTotalAmountWithTax() { return 0; }
  calculateAmountWithoutTax() { return 0; }
  calculateTaxBasedOnAmount() { return 0; }
}

const api = new ComplexAPI();

// Short name tests
api.id; // Correct
api.ii; // Should suggest "id" or "ui" or "ip"
api.i; // Should suggest "id" or "ui" or "ip"

// Similar prefix tests
api.initializeState(); // Should suggest one of the initialize methods
api.initialData(); // Should suggest initializeData
api.initializeUsre(); // Should suggest initializeUser (typo)

// Number suffix confusion
api.process4(); // Should suggest one of the process methods
api.proces2(); // Should suggest process2 (typo)

// Complex naming pattern tests
api.calculateTaxAmount(); // Should suggest one of the calculate methods
api.calculateAmountWithTax(); // Should suggest calculateTotalAmountWithTax or calculateAmountWithoutTax
api.calcTotalWithTax(); // Should suggest calculateTotalAmountWithTax 