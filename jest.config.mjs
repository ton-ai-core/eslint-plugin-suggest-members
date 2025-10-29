// CHANGE: Jest configuration for ESLint plugin testing
// WHY: Configure Jest for TypeScript with CommonJS compatibility
// PURITY: SHELL (test configuration)

/** @type {import('jest').Config} */
export default {
	// CHANGE: Use TypeScript preset with ESM support
	// WHY: Enable TypeScript compilation with ES modules
	preset: 'ts-jest/presets/default-esm',
	
	// CHANGE: Set Node.js test environment
	// WHY: ESLint plugins run in Node.js environment
	testEnvironment: 'node',
	
	// CHANGE: Enable ESM support
	// WHY: Project uses ES modules
	extensionsToTreatAsEsm: ['.ts'],
	
	// CHANGE: Set root directories
	// WHY: Include tests directory
	roots: ['<rootDir>/test', '<rootDir>/src'],
	
	// CHANGE: Test file patterns
	// WHY: Include all test files in tests directory
	testMatch: [
		'<rootDir>/test/**/*.test.ts',
		'<rootDir>/test/**/*.spec.ts'
	],
	
	// CHANGE: Ignore patterns
	// WHY: Skip non-test files
	testPathIgnorePatterns: [
		'/node_modules/',
		'/dist/',
		'/coverage/'
	],
	
	// CHANGE: Transform TypeScript files with ESM support
	// WHY: Compile TypeScript test files as ES modules
	transform: {
		'^.+\\.ts$': ['ts-jest', {
			tsconfig: 'tsconfig.test.json',
			useESM: true
		}]
	},
	
	// CHANGE: Module name mapping for .js imports
	// WHY: Handle .js imports that resolve to .ts files
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	
	// CHANGE: Coverage configuration
	// WHY: Generate comprehensive coverage reports
	collectCoverage: false, // Disable for now to focus on getting tests running
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.d.ts',
		'!src/**/*.test.ts',
		'!src/**/*.spec.ts',
		'!src/core/metadata/generated.ts', // Exclude generated file
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	
	// CHANGE: Test timeout
	// WHY: Allow sufficient time for ESLint rule testing
	testTimeout: 10000,
	
	// CHANGE: Verbose output for debugging
	// WHY: Provide detailed test output during development
	verbose: true,
	
	// CHANGE: Clear mocks between tests
	// WHY: Ensure test isolation
	clearMocks: true,
	
	// CHANGE: Restore mocks after each test
	// WHY: Clean up test state
	restoreMocks: true,
};