/**
 * Example 4: Jaro-Winkler Algorithm Test Cases
 * 
 * This example tests the plugin's implementation of the Jaro-Winkler algorithm
 * with a specific focus on:
 * - Transposition handling
 * - Prefix matching
 * - Substring similarity
 */

class JaroWinklerTest {
  // Test cases for transpositions
  firstName = "John";
  lastName = "Smith";
  
  // Specially crafted method names to test Jaro-Winkler algorithm
  createUserAccount() { return {}; }
  createAccountUser() { return {}; }  // Transposed words
  
  updateProfileSettings() { return {}; }
  updateSettingsProfile() { return {}; }  // Transposed words
  
  // Methods with common prefixes
  prefixDatabase() { return {}; }
  prefixDesignation() { return {}; }
  prefixDescription() { return {}; }
  
  // Methods with common suffixes
  handleActionComplete() { return {}; }
  processActionComplete() { return {}; }
  triggerActionComplete() { return {}; }
}

const jwTest = new JaroWinklerTest();

// Transposition tests
jwTest.fristName; // Should suggest "firstName" (transposition)
jwTest.lastNaem; // Should suggest "lastName" (transposition)

// Method name transposition tests
jwTest.createAccountUser(); // This is valid but exists to show symmetry
jwTest.createUresAccount(); // Should suggest "createUserAccount" (transposition within word)
jwTest.updtaeProfileSettings(); // Should suggest "updateProfileSettings" (transposition)

// Prefix matching tests
jwTest.prefixDtabase(); // Should suggest "prefixDatabase" (transposition)
jwTest.prefixDscription(); // Should suggest "prefixDescription" (missing letter)
jwTest.prefixDesi(); // Should suggest prefixDesignation (partial match)

// Common suffixes tests
jwTest.handleActionCopmlete(); // Should suggest "handleActionComplete" (transposition)
jwTest.prcesActionComplete(); // Should suggest "processActionComplete" (transposition)
jwTest.triggActionComplete(); // Should suggest "triggerActionComplete" (missing letter)

// Test unique Jaro-Winkler feature - prefix weighting
jwTest.crea(); // Should favor methods starting with "crea" over other possibilities
jwTest.upda(); // Should favor methods starting with "upda" over other possibilities 