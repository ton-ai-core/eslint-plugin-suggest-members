// CHANGE: Test fixture with example classes for testing
// WHY: Provide realistic code examples for rule testing
// PURITY: SHELL (test data)

/**
 * Simple class for basic member access testing
 */
export class MyClass {
	ping() {
		return "pong";
	}

	foo = 123;
	foo1 = 123;

	processData(data: string) {
		return data.toUpperCase();
	}

	getFullName() {
		return "Test";
	}
}

/**
 * API client class for testing token-based similarity
 */
export class APIClient {
	fetchUserData() {
		return { name: "John" };
	}

	getUserProfile() {
		return { profile: "default" };
	}

	sendUserMessage(message: string) {
		console.log(`Sending: ${message}`);
	}

	uploadFile(file: string) {
		console.log(`Uploading: ${file}`);
	}
}

/**
 * Complex API class for edge case testing
 */
export class ComplexAPI {
	// Short names
	id = 1;
	ip = "127.0.0.1";
	ui = "default";

	// Similar methods with different prefixes
	initializeData() {
		return {};
	}
	initializeUser() {
		return {};
	}
	initializeConfig() {
		return {};
	}

	// Methods with numbers
	process1() {
		return {};
	}
	process2() {
		return {};
	}
	process3() {
		return {};
	}

	// Complex naming patterns
	calculateTotalAmountWithTax() {
		return 0;
	}
	calculateAmountWithoutTax() {
		return 0;
	}
	calculateTaxBasedOnAmount() {
		return 0;
	}
}

/**
 * Jaro-Winkler algorithm test class
 */
export class JaroWinklerTest {
	// Test cases for transpositions
	firstName = "John";
	lastName = "Smith";

	// Specially crafted method names to test Jaro-Winkler algorithm
	createUserAccount() {
		return {};
	}
	createAccountUser(): object {
		return {};
	} // Transposed words

	updateProfileSettings(): object {
		return {};
	}
	updateSettingsProfile(): object {
		return {};
	} // Transposed words

	// Methods with common prefixes
	prefixDatabase() {
		return {};
	}
	prefixDesignation() {
		return {};
	}
	prefixDescription() {
		return {};
	}

	// Methods with common suffixes
	handleActionComplete() {
		return {};
	}
	processActionComplete() {
		return {};
	}
	triggerActionComplete() {
		return {};
	}
}

/**
 * Corner case test class
 */
export class CornerCaseTest {
	// Very short method names
	a() {
		return 1;
	}
	b() {
		return 2;
	}
	c() {
		return 3;
	}

	// Methods with no obvious similarity to each other
	randomMethod() {
		return {};
	}
	processInformation() {
		return {};
	}
	calculateValue() {
		return {};
	}

	// Properties with common prefixes
	userFirstName = "";
	userLastName = "";
	userEmail = "";

	// Properties with common suffixes
	internalId = 0;
	externalId = 0;
	temporaryId = 0;
}
