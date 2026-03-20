# Code Quality Standards

## Clean Code Principles

### Naming Conventions

- **Variables**: camelCase, descriptive names
- **Functions**: camelCase, verb-based (getUserData, calculateTotal)
- **Classes**: PascalCase, noun-based (UserService, PaymentProcessor)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Files**: kebab-case for files, PascalCase for components

### Function Design

- **Single Responsibility**: One function, one purpose
- **Small Functions**: Ideally < 20 lines, max 50 lines
- **Pure Functions**: No side effects when possible
- **Clear Parameters**: Max 3-4 parameters, use objects for more
- **Return Early**: Reduce nesting with guard clauses

### Code Organization

```typescript
// ✅ GOOD: Clear structure
function processPayment(order: Order): PaymentResult {
  // Guard clauses first
  if (!order.items.length) {
    return { success: false, error: 'Empty order' };
  }
  
  if (!order.user.paymentMethod) {
    return { success: false, error: 'No payment method' };
  }
  
  // Main logic
  const total = calculateTotal(order);
  const result = chargePayment(order.user.paymentMethod, total);
  
  return result;
}

// ❌ BAD: Nested conditions
function processPayment(order: Order): PaymentResult {
  if (order.items.length) {
    if (order.user.paymentMethod) {
      const total = calculateTotal(order);
      const result = chargePayment(order.user.paymentMethod, total);
      return result;
    } else {
      return { success: false, error: 'No payment method' };
    }
  } else {
    return { success: false, error: 'Empty order' };
  }
}
```

## TypeScript Best Practices

### Type Safety

```typescript
// ✅ GOOD: Proper typing
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`).then(res => res.json());
}

// ❌ BAD: Using any
function getUser(id: any): Promise<any> {
  return fetch(`/api/users/${id}`).then(res => res.json());
}
```

### Utility Types

```typescript
// Use built-in utility types
type PartialUser = Partial<User>;
type UserWithoutEmail = Omit<User, 'email'>;
type UserIdAndName = Pick<User, 'id' | 'name'>;
type ReadonlyUser = Readonly<User>;
```

## Error Handling

### Always Handle Errors

```typescript
// ✅ GOOD: Proper error handling
async function fetchUserData(id: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${id}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch user: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// ❌ BAD: No error handling
async function fetchUserData(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return await response.json();
}
```

### Custom Error Types

```typescript
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}
```

## Testing Standards

### Test Structure

```typescript
describe('UserService', () => {
  describe('getUser', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = '123';
      const expectedUser = { id: userId, name: 'John' };
      
      // Act
      const result = await userService.getUser(userId);
      
      // Assert
      expect(result).toEqual(expectedUser);
    });
    
    it('should return null when user not found', async () => {
      const result = await userService.getUser('invalid');
      expect(result).toBeNull();
    });
  });
});
```

### Test Coverage Goals

- **Critical paths**: 100% coverage
- **Business logic**: 90%+ coverage
- **UI components**: 80%+ coverage
- **Utilities**: 95%+ coverage

## Performance Guidelines

### Avoid Premature Optimization

1. **Write clean code first**
2. **Measure performance**
3. **Optimize bottlenecks only**
4. **Measure again to verify**

### Common Optimizations

```typescript
// ✅ GOOD: Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ GOOD: Debounce frequent operations
const debouncedSearch = useMemo(
  () => debounce((query: string) => search(query), 300),
  []
);

// ✅ GOOD: Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

## Code Review Checklist

Before submitting code:

- [ ] No TypeScript errors
- [ ] No linting warnings
- [ ] All tests passing
- [ ] Code is self-documenting (clear names)
- [ ] Complex logic has comments
- [ ] No console.log in production code
- [ ] Error handling implemented
- [ ] Edge cases considered
- [ ] Performance measured if critical path
- [ ] Accessibility verified for UI changes

## Anti-Patterns to Avoid

❌ **Magic Numbers**: Use named constants
❌ **Deep Nesting**: Max 3 levels, use early returns
❌ **Long Functions**: Break into smaller functions
❌ **Duplicate Code**: Extract to reusable functions
❌ **Unclear Names**: Avoid abbreviations, be descriptive
❌ **Side Effects**: Keep functions pure when possible
❌ **Ignoring Errors**: Always handle errors
❌ **Premature Optimization**: Measure first
❌ **Over-Engineering**: Keep it simple
❌ **No Tests**: Test critical logic

## Documentation

### When to Comment

```typescript
// ✅ GOOD: Explain WHY, not WHAT
// Using exponential backoff to avoid overwhelming the API
// during high traffic periods
const retryDelay = Math.pow(2, attemptNumber) * 1000;

// ❌ BAD: Stating the obvious
// Set retry delay to 2 to the power of attempt number times 1000
const retryDelay = Math.pow(2, attemptNumber) * 1000;
```

### JSDoc for Public APIs

```typescript
/**
 * Fetches user data from the API with automatic retry logic.
 * 
 * @param userId - The unique identifier of the user
 * @param options - Optional configuration for the request
 * @returns Promise resolving to User object or null if not found
 * @throws {NetworkError} When network request fails after retries
 */
async function fetchUser(
  userId: string,
  options?: FetchOptions
): Promise<User | null> {
  // Implementation
}
```

## Git Commit Standards

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```
feat(auth): add OAuth2 authentication

Implements OAuth2 flow with Google and GitHub providers.
Includes token refresh logic and session management.

Closes #123
```

```
fix(api): handle null response in user endpoint

Added null check to prevent crashes when user not found.
```
