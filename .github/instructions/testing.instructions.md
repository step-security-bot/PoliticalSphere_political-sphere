---
applies_to:
  - '**/*.test.{ts,tsx,js,jsx}'
  - '**/*.spec.{ts,tsx,js,jsx}'
  - '**/tests/**'
  - '**/test/**'
  - '**/__tests__/**'
---

# Testing Instructions for GitHub Copilot

## Test File Conventions

When creating or modifying test files in this repository:

### File Naming

- Unit tests: `*.test.ts` or `*.spec.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`
- Place test files adjacent to source files or in `__tests__/` directories

### Test Structure (AAA Pattern)

Follow the Arrange-Act-Assert pattern:

```typescript
describe('Component/Function name', () => {
  it('should do something specific', () => {
    // Arrange: Set up test data and mocks
    const input = { value: 'test' };
    const mockFn = vi.fn();

    // Act: Execute the code under test
    const result = functionToTest(input, mockFn);

    // Assert: Verify the results
    expect(result).toBe(expected);
    expect(mockFn).toHaveBeenCalledWith(input);
  });
});
```

### Test Coverage Requirements

- **Unit tests**: 80%+ coverage for critical paths
- **Integration tests**: Cover all external dependencies
- **E2E tests**: Cover critical user journeys
- Always test both success and failure scenarios
- Include edge cases and boundary conditions

### Testing Best Practices

1. **Use descriptive test names**: `it('should validate email format and return error for invalid input')`
2. **One assertion per test** (when feasible): Focus on single behaviors
3. **Mock external dependencies**: Use `vi.mock()` for external services
4. **Clean up after tests**: Reset mocks, clear timers, restore spies
5. **Avoid test interdependence**: Each test should be independent
6. **Use test data factories**: Create reusable test data generators

### Vitest-Specific Guidelines

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Accessibility Testing

Include accessibility tests for all UI components:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Security Testing

Test security-critical code paths:

```typescript
describe('Input validation', () => {
  it('should reject SQL injection attempts', () => {
    const maliciousInput = "'; DROP TABLE users; --";
    expect(() => validateInput(maliciousInput)).toThrow();
  });

  it('should sanitize XSS attempts', () => {
    const xssInput = '<script>alert("XSS")</script>';
    const sanitized = sanitizeInput(xssInput);
    expect(sanitized).not.toContain('<script>');
  });
});
```

### Common Test Patterns

**Testing async code:**

```typescript
it('should fetch data successfully', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

**Testing errors:**

```typescript
it('should throw error for invalid input', () => {
  expect(() => process(invalidInput)).toThrow('Invalid input');
});
```

**Testing React hooks:**

```typescript
import { renderHook } from '@testing-library/react';

it('should update state', () => {
  const { result } = renderHook(() => useMyHook());

  act(() => {
    result.current.updateValue('new value');
  });

  expect(result.current.value).toBe('new value');
});
```

### Test Data Management

Create test data factories for reusability:

```typescript
// test/factories/user.factory.ts
export const createTestUser = (overrides = {}) => ({
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});

// In tests
const user = createTestUser({ email: 'custom@example.com' });
```

### When Creating Tests

Always include:

- [ ] Success scenarios
- [ ] Failure scenarios
- [ ] Edge cases (empty input, null, undefined, boundary values)
- [ ] Error handling
- [ ] Accessibility checks (for UI components)
- [ ] Security validation (for input handling)

### Running Tests

- Local development: `npm run test:watch`
- Single run: `npm test`
- Coverage: `npm run test:ci`
- Specific file: `npm test -- path/to/file.test.ts`

### Test Quality Checklist

Before submitting tests:

- [ ] Tests have clear, descriptive names
- [ ] Tests follow AAA pattern
- [ ] All mocks are properly cleaned up
- [ ] Coverage meets threshold (80%+)
- [ ] No skipped tests (`it.skip`) without explanation
- [ ] No hardcoded wait times (use proper async patterns)
- [ ] Tests are deterministic (same result every time)
