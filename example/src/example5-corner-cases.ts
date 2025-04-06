/**
 * Example 5: Corner Cases Testing
 * 
 * This example tests the plugin's behavior in difficult edge cases:
 * - Very short method names
 * - No good matches available
 * - Completely incorrect property names
 * - Methods with common prefixes/suffixes
 */

class CornerCaseTest {
  // Very short method names
  a() { return 1; }
  b() { return 2; }
  c() { return 3; }
  
  // Methods with no obvious similarity to each other
  randomMethod() { return {}; }
  processInformation() { return {}; }
  calculateValue() { return {}; }
  
  // Properties with common prefixes
  userFirstName = "";
  userLastName = "";
  userEmail = "";
  
  // Properties with common suffixes
  internalId = 0;
  externalId = 0;
  temporaryId = 0;
}

const corner = new CornerCaseTest();

// Short method name tests
corner.a(); // Correct, exists to establish context
corner.d(); // Should possibly suggest a, b, or c, but might be ambiguous

// No good match tests
corner.xyz(); // No good match exists, should handle gracefully
corner.unknownMethod(); // No good match exists, should handle gracefully

// Common prefix property tests
corner.userPhoneNumber; // No exact property, but shares prefix
corner.useraddress; // Test case sensitivity handling with "user" prefix

// Common suffix property tests
corner.globalId; // Should match with one of the ID properties
corner.tempId; // Should match with temporaryId

// Special test cases
corner.UserFirstName; // Test case sensitivity handling
corner.randomfunction(); // Test for method/function naming conventions
corner.processinfo(); // Test for combined lowercase vs. camelCase 