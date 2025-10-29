# Test Suite Documentation

## Overview

This test suite provides comprehensive coverage for the ESLint plugin suggest-members, following functional architecture principles and mathematical verification approaches.

## Test Structure

```
tests/
├── unit/                    # Unit tests for pure functions
│   ├── core/               # Core layer tests (pure functions)
│   │   ├── similarity/     # Similarity algorithm tests
│   │   └── metadata/       # Metadata extraction tests
│   └── shell/              # Shell layer tests (effects)
├── integration/            # Integration tests for rules
│   └── rules/              # ESLint rule integration tests
├── e2e/                    # End-to-end plugin tests
├── performance/            # Performance benchmarks
├── fixtures/               # Test data and examples
└── setup.ts               # Test configuration
```

## Test Categories

### Unit Tests (`tests/unit/`)

Test individual functions and components in isolation:

- **Core Layer**: Pure functions, mathematical algorithms
- **Shell Layer**: Effect-based services, IO operations
- **Mathematical Properties**: Verify invariants and properties

### Integration Tests (`tests/integration/`)

Test complete ESLint rules with realistic code examples:

- **suggest-members**: Member access suggestions
- **suggest-imports**: Import name suggestions  
- **suggest-module-paths**: Module path suggestions

### End-to-End Tests (`tests/e2e/`)

Test complete plugin integration with ESLint:

- Plugin loading and configuration
- Multiple rule interactions
- Real-world usage scenarios

### Performance Tests (`tests/performance/`)

Benchmark critical algorithms:

- Similarity algorithm performance
- Memory usage patterns
- Scalability testing

## Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# CI mode
npm run test:ci
```

## Test Data

### Fixtures (`tests/fixtures/`)

Realistic code examples for testing:

- `example-classes.ts`: Various class structures for member testing
- Real-world scenarios from the example directory

### Example Test Cases

Based on the provided examples:

1. **Simple Typos**: `proprty` → `property`
2. **Method Names**: `procesData` → `processData`
3. **Transpositions**: `fristName` → `firstName`
4. **Token Similarity**: `userData` → `fetchUserData`
5. **Import Errors**: `readFileSyncc` → `readFileSync`
6. **Module Paths**: `'f'` → `'fs'`

## Mathematical Verification

Tests verify mathematical properties:

- **Similarity Functions**: 
  - Identity: `jaro(s, s) = 1.0`
  - Symmetry: `jaro(s1, s2) = jaro(s2, s1)`
  - Bounds: `0 ≤ jaro(s1, s2) ≤ 1`

- **Extraction Functions**:
  - Invariants: `∀ pkg: valid(pkg) → extractable(pkg.name, pkg.version)`
  - Postconditions: `result.name === input.name`

## Coverage Requirements

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Performance Benchmarks

- **Small datasets** (10 items): < 10ms
- **Medium datasets** (50 items): < 50ms
- **Long strings** (1000 chars): < 100ms
- **Real-world scenarios**: < 50ms

## Test Philosophy

Following functional architecture principles:

1. **Pure Function Testing**: Mathematical verification of core algorithms
2. **Effect Testing**: Controlled testing of side effects
3. **Property-Based Testing**: Verify algorithmic properties hold
4. **Integration Testing**: Ensure layers work together correctly
5. **Performance Testing**: Verify scalability and efficiency

## Adding New Tests

When adding new functionality:

1. **Unit Tests**: Test pure functions in isolation
2. **Integration Tests**: Test complete rule behavior
3. **Performance Tests**: Benchmark if performance-critical
4. **Mathematical Properties**: Verify invariants and properties
5. **Real-world Examples**: Use realistic code scenarios