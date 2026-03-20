---
description: Run tests and create test coverage for code
---

# /test - Testing & Quality Assurance

## Purpose

Run tests, create test coverage, and ensure code quality through systematic testing.

## Steps

1. **Test Strategy Selection**
   - Determine test types needed (unit, integration, e2e)
   - Identify critical paths
   - Plan test coverage goals

// turbo
2. **Run Existing Tests**
   - Execute test suite
   - Check coverage
   - Identify failures

3. **Create Missing Tests**
   - Write unit tests for functions
   - Add integration tests for features
   - Create e2e tests for user flows

// turbo
4. **Verify Quality**
   - Run full test suite
   - Check coverage metrics
   - Fix failing tests

## Test Types

### Unit Tests
- Test individual functions
- Mock dependencies
- Fast execution
- High coverage

### Integration Tests
- Test component interactions
- Test API endpoints
- Database operations
- Service integration

### E2E Tests
- Test user workflows
- Browser automation
- Critical user paths
- Production-like environment

## Testing Commands

### Jest/Vitest
```bash
npm test
npm run test:coverage
npm run test:watch
```

### Playwright
```bash
npx playwright test
npx playwright test --ui
npx playwright test --debug
```

### Cypress
```bash
npx cypress open
npx cypress run
```

## Test Coverage Goals

- **Critical paths**: 100% coverage
- **Business logic**: 90%+ coverage
- **UI components**: 80%+ coverage
- **Utilities**: 95%+ coverage

## Examples

```
/test create tests for authentication
/test run e2e tests for checkout flow
/test add unit tests for utils
/test verify API endpoints
```

## Key Principles

- **Test behavior, not implementation** - focus on what, not how
- **Keep tests simple** - one assertion per test when possible
- **Fast feedback** - unit tests should run in milliseconds
- **Realistic data** - use production-like test data
- **Maintain tests** - update tests with code changes
