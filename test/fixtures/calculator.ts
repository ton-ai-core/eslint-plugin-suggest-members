// CHANGE: Test fixture - calculator module
// WHY: Provide another valid module for similarity testing
// PURITY: CORE - pure calculation functions

/**
 * Calculator class for testing
 *
 * @pure true for all methods
 */
export class Calculator {
	/**
	 * Add two numbers
	 *
	 * @pure true
	 * @complexity O(1)
	 */
	add(a: number, b: number): number {
		return a + b;
	}

	/**
	 * Subtract two numbers
	 *
	 * @pure true
	 * @complexity O(1)
	 */
	subtract(a: number, b: number): number {
		return a - b;
	}

	/**
	 * Multiply two numbers
	 *
	 * @pure true
	 * @complexity O(1)
	 */
	multiply(a: number, b: number): number {
		return a * b;
	}
}

export default Calculator;
