# Testing Guide

**Last Updated:** 2025-11-25  
**Status:** ✅ Active - 32 tests passing, 76% coverage

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Structure](#test-structure)
6. [Mocking](#mocking)
7. [Coverage Goals](#coverage-goals)
8. [CI/CD Integration](#cicd-integration)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Testing Philosophy

### Why We Test

- **Prevent regressions:** Catch bugs before they reach production
- **Enable refactoring:** Change code confidently without breaking functionality
- **Document behavior:** Tests serve as living documentation
- **Epic 3 requirement:** Money-handling code requires 100% test coverage

### What We Test

- ✅ **Business logic:** Validators, utilities, state machines
- ✅ **Server actions:** API endpoints, database operations
- ✅ **React hooks:** Custom hooks with side effects
- ✅ **React components:** UI components with user interactions
- ❌ **Third-party libraries:** Don't test external code
- ❌ **Simple getters/setters:** Focus on complex logic

### Coverage Goals

| Code Type | Target Coverage | Rationale |
|-----------|----------------|-----------|
| Utilities & Validators | 80%+ | Core business logic |
| Financial Logic (Epic 3+) | 100% | Money handling - zero tolerance for bugs |
| Server Actions | 80%+ | Critical user flows |
| React Hooks | 80%+ | Complex state management |
| React Components | 60%+ | Focus on interactions, not styling |

**Current Status:** 76% overall coverage (32 tests passing)

---

## Test Types

### 1. Unit Tests

**Purpose:** Test individual functions in isolation

**Examples:**
- Email validators
- Currency formatters
- String utilities
- Business logic functions

**Location:** Next to source file or in `__tests__` directory

```typescript
// src/lib/validators/email-domain.test.ts
import { describe, it, expect } from 'vitest';
import { validateEmailDomain } from './email-domain';

describe('validateEmailDomain', () => {
    it('should validate a correct work email', async () => {
        const result = await validateEmailDomain('employee@company.com');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
    });

    it('should reject public domains', async () => {
        const result = await validateEmailDomain('user@gmail.com');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Public email domains are not supported');
    });
});
```

---

### 2. Integration Tests

**Purpose:** Test multiple components working together (e.g., server actions + database)

**Examples:**
- Server actions that query the database
- API routes with authentication
- Multi-step workflows

**Location:** `src/server/actions/*.test.ts` or `src/server/procedures/*.test.ts`

```typescript
// src/server/actions/invitations.test.ts
import { describe, it, expect, vi } from 'vitest';
import { validateInvitationCode } from './invitations';
import { db } from '@/db';

// Mock database
vi.mock('@/db', () => ({
    db: {
        query: {
            invitations: {
                findFirst: vi.fn(),
            },
        },
    },
}));

describe('validateInvitationCode', () => {
    it('should return success for valid code', async () => {
        const mockInvitation = {
            id: 'inv-1',
            code: 'VALID',
            employerId: 'org-1',
            usedAt: null,
            expiresAt: new Date(Date.now() + 10000),
        };

        vi.mocked(db.query.invitations.findFirst).mockResolvedValue(mockInvitation);

        const result = await validateInvitationCode('VALID');
        expect(result.success).toBe(true);
    });
});
```

---

### 3. React Hook Tests

**Purpose:** Test custom React hooks with state and side effects

**Examples:**
- `useOnlineStatus` (PWA offline detection)
- `useDebounce` (search input)
- `useLocalStorage` (persistence)

**Location:** `src/hooks/__tests__/*.test.ts`

**Important:** Use `// @vitest-environment jsdom` at the top of the file

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../useOnlineStatus';

describe('useOnlineStatus', () => {
    let onlineGetter: vi.SpyInstance;

    beforeEach(() => {
        // Mock navigator.onLine
        onlineGetter = vi.spyOn(navigator, 'onLine', 'get');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return initial online status', () => {
        onlineGetter.mockReturnValue(true);

        const { result } = renderHook(() => useOnlineStatus());

        expect(result.current.isOnline).toBe(true);
    });

    it('should update status when online event fires', () => {
        onlineGetter.mockReturnValue(false);

        const { result } = renderHook(() => useOnlineStatus());

        expect(result.current.isOnline).toBe(false);

        // Simulate going online
        act(() => {
            window.dispatchEvent(new Event('online'));
        });

        expect(result.current.isOnline).toBe(true);
    });
});
```

---

### 4. React Component Tests

**Purpose:** Test UI components and user interactions

**Examples:**
- Button clicks
- Form submissions
- Conditional rendering

**Location:** `src/components/**/__tests__/*.test.tsx`

**Important:** Use `// @vitest-environment jsdom` at the top of the file

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineBanner } from '../OfflineBanner';

describe('OfflineBanner', () => {
    it('should render when offline', () => {
        render(<OfflineBanner isOnline={false} />);
        
        expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();
    });

    it('should not render when online', () => {
        render(<OfflineBanner isOnline={true} />);
        
        expect(screen.queryByText(/You are currently offline/i)).not.toBeInTheDocument();
    });
});
```

---

### 5. E2E Tests (Future)

**Purpose:** Test complete user flows in a real browser

**Tool:** Playwright (not yet implemented)

**Examples:**
- User registration flow
- Deal browsing and search
- Escrow transaction (Epic 3)

**Status:** ⏳ Planned for Epic 3 or later

---

## Running Tests

### Commands

```bash
# Run all tests (watch mode)
npm test

# Run tests once (CI mode)
npm test -- --run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/lib/validators/email-domain.test.ts

# Run tests matching pattern
npm test -- --grep "validateEmail"

# Run tests in watch mode for specific file
npm test -- src/hooks/__tests__/useOnlineStatus.test.ts
```

### Watch Mode

By default, `npm test` runs in **watch mode**:
- Tests re-run automatically when files change
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `q` to quit

### Coverage Report

```bash
npm run test:coverage -- --run
```

Coverage reports are generated in:
- **Terminal:** Summary table
- **HTML:** `coverage/index.html` (open in browser for detailed view)
- **JSON:** `coverage/coverage-final.json` (for CI/CD)

---

## Writing Tests

### Test File Naming

- **Unit tests:** `*.test.ts` or `*.test.tsx`
- **Location:** Next to source file or in `__tests__` directory

```
src/
  lib/
    validators/
      email-domain.ts
      email-domain.test.ts        ✅ Next to source
  hooks/
    __tests__/                     ✅ In __tests__ directory
      useOnlineStatus.test.ts
    useOnlineStatus.ts
```

### Test Structure (Arrange-Act-Assert)

```typescript
describe('Feature or Component Name', () => {
    it('should do something specific', () => {
        // ARRANGE: Set up test data and mocks
        const input = 'test@example.com';
        const expected = true;

        // ACT: Execute the function/action
        const result = validateEmail(input);

        // ASSERT: Verify the result
        expect(result).toBe(expected);
    });
});
```

### Describe Blocks

Use `describe` to group related tests:

```typescript
describe('validateEmailDomain', () => {
    describe('valid emails', () => {
        it('should accept work emails', async () => {
            // Test valid case
        });
    });

    describe('invalid emails', () => {
        it('should reject public domains', async () => {
            // Test invalid case
        });

        it('should reject malformed emails', async () => {
            // Test another invalid case
        });
    });
});
```

### Test Naming

Use descriptive test names that explain **what** is being tested and **expected outcome**:

✅ **Good:**
- `should return true for valid email addresses`
- `should reject public domains like gmail.com`
- `should update status when online event fires`
- `should rate limit after 5 attempts`

❌ **Bad:**
- `test email validation`
- `it works`
- `test 1`

---

## Mocking

### Why Mock?

- **Isolate tests:** Test one thing at a time
- **Avoid external dependencies:** Don't hit real databases or APIs
- **Control test data:** Predictable test results
- **Speed:** Mocks are faster than real operations

### Mocking Modules

```typescript
import { vi } from 'vitest';
import { db } from '@/db';

// Mock entire module
vi.mock('@/db', () => ({
    db: {
        query: {
            invitations: {
                findFirst: vi.fn(),
            },
        },
    },
}));

// Use mock in test
vi.mocked(db.query.invitations.findFirst).mockResolvedValue(mockData);
```

### Mocking Functions

```typescript
import { vi } from 'vitest';

// Create mock function
const mockCallback = vi.fn();

// Set return value
mockCallback.mockReturnValue(42);

// Set async return value
mockCallback.mockResolvedValue({ success: true });

// Verify it was called
expect(mockCallback).toHaveBeenCalled();
expect(mockCallback).toHaveBeenCalledWith('expected-arg');
expect(mockCallback).toHaveBeenCalledTimes(2);
```

### Mocking Browser APIs

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

describe('useOnlineStatus', () => {
    let onlineGetter: vi.SpyInstance;

    beforeEach(() => {
        // Mock navigator.onLine
        onlineGetter = vi.spyOn(navigator, 'onLine', 'get');
        onlineGetter.mockReturnValue(true);
    });

    afterEach(() => {
        // Restore original implementation
        vi.restoreAllMocks();
    });

    it('should use mocked value', () => {
        expect(navigator.onLine).toBe(true);
    });
});
```

### Mocking Timers

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.restoreAllMocks();
});

it('should debounce function calls', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 1000);

    debounced();
    debounced();
    debounced();

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    // Should only be called once
    expect(callback).toHaveBeenCalledTimes(1);
});
```

---

## Test Lifecycle Hooks

### beforeEach / afterEach

Run before/after **each** test:

```typescript
describe('MyComponent', () => {
    beforeEach(() => {
        // Set up before each test
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Clean up after each test
        vi.restoreAllMocks();
    });

    it('test 1', () => { /* ... */ });
    it('test 2', () => { /* ... */ });
});
```

### beforeAll / afterAll

Run once before/after **all** tests in a describe block:

```typescript
describe('Database tests', () => {
    beforeAll(async () => {
        // Set up database connection
        await db.connect();
    });

    afterAll(async () => {
        // Close database connection
        await db.disconnect();
    });

    it('test 1', () => { /* ... */ });
    it('test 2', () => { /* ... */ });
});
```

---

## Coverage Goals

### Setting Thresholds

Coverage thresholds are configured in `vitest.config.ts`:

```typescript
export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
            },
            exclude: [
                'node_modules/',
                'dist/',
                '**/*.config.ts',
                '**/*.d.ts',
                '**/types.ts',
            ],
        },
    },
});
```

### Coverage Metrics

- **Lines:** Percentage of code lines executed
- **Functions:** Percentage of functions called
- **Branches:** Percentage of if/else branches taken
- **Statements:** Percentage of statements executed

### Epic 3 Requirements

For **escrow state machine** and **financial logic**:
- ✅ **100% coverage required**
- ✅ Test all state transitions
- ✅ Test all edge cases
- ✅ Test error handling

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on every push and pull request.

**Workflows:**
- `.github/workflows/test.yml` - Run tests and generate coverage
- `.github/workflows/lint.yml` - Run ESLint and TypeScript checks

**Status:**
- ✅ Tests must pass before merge
- ✅ Coverage reports uploaded as artifacts
- ✅ Failures block deployment

### Viewing Results

1. Go to **GitHub Actions** tab
2. Click on latest workflow run
3. View test results and coverage reports
4. Download coverage artifacts if needed

---

## Best Practices

### 1. Test Behavior, Not Implementation

✅ **Good:** Test what the function does
```typescript
it('should format currency as Nigerian Naira', () => {
    expect(formatCurrency(50000)).toBe('₦50,000');
});
```

❌ **Bad:** Test internal implementation details
```typescript
it('should call toLocaleString with en-NG locale', () => {
    // Don't test implementation details
});
```

### 2. Keep Tests Independent

Each test should run independently without relying on other tests:

✅ **Good:**
```typescript
it('test 1', () => {
    const data = createTestData();
    expect(process(data)).toBe(expected);
});

it('test 2', () => {
    const data = createTestData(); // Fresh data
    expect(process(data)).toBe(expected);
});
```

❌ **Bad:**
```typescript
let sharedData;

it('test 1', () => {
    sharedData = createTestData();
    // ...
});

it('test 2', () => {
    // Relies on test 1 running first
    expect(process(sharedData)).toBe(expected);
});
```

### 3. Use Descriptive Test Data

✅ **Good:**
```typescript
const validInvitation = {
    code: 'VALID-CODE',
    expiresAt: new Date('2030-01-01'),
    usedAt: null,
};
```

❌ **Bad:**
```typescript
const inv = { c: 'ABC', e: new Date(), u: null };
```

### 4. Test Edge Cases

Don't just test the happy path:

```typescript
describe('validateEmail', () => {
    it('should accept valid emails', () => { /* ... */ });
    
    // Edge cases
    it('should reject empty strings', () => { /* ... */ });
    it('should reject null/undefined', () => { /* ... */ });
    it('should handle very long emails', () => { /* ... */ });
    it('should handle special characters', () => { /* ... */ });
});
```

### 5. Avoid Flaky Tests

Flaky tests pass/fail randomly. Common causes:

❌ **Timing issues:**
```typescript
// Bad: Race condition
setTimeout(() => expect(result).toBe(true), 100);
```

✅ **Use proper async handling:**
```typescript
// Good: Wait for promise
await waitFor(() => expect(result).toBe(true));
```

❌ **Random data:**
```typescript
// Bad: Non-deterministic
const randomId = Math.random();
```

✅ **Use fixed test data:**
```typescript
// Good: Predictable
const testId = 'test-id-123';
```

### 6. Clean Up After Tests

Always restore mocks and clean up side effects:

```typescript
afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
    localStorage.clear();
});
```

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module '@/...'"

**Problem:** Path alias not configured

**Solution:** Check `vitest.config.ts`:
```typescript
resolve: {
    alias: {
        '@': path.resolve(__dirname, './src'),
    },
},
```

#### 2. "ReferenceError: window is not defined"

**Problem:** Test needs browser environment

**Solution:** Add to top of test file:
```typescript
// @vitest-environment jsdom
```

#### 3. "TypeError: render is not a function"

**Problem:** Missing `@testing-library/react`

**Solution:** Install dependencies:
```bash
npm install -D @testing-library/react @testing-library/jest-dom jsdom
```

#### 4. Tests pass locally but fail in CI

**Problem:** Environment differences

**Solution:**
- Check Node.js version matches CI
- Ensure `npm ci` (not `npm install`) in CI
- Check for timezone/locale differences
- Avoid relying on file system paths

#### 5. "Mock is not a function"

**Problem:** Mock not properly typed

**Solution:**
```typescript
import { vi } from 'vitest';

// Type the mock
vi.mocked(db.query.invitations.findFirst).mockResolvedValue(data);
```

---

## Examples from Codebase

### Unit Test Example
[`src/lib/validators/email-domain.test.ts`](file:///c:/User/USER/perks-app/src/lib/validators/email-domain.test.ts)

### Integration Test Example
[`src/server/actions/invitations.test.ts`](file:///c:/User/USER/perks-app/src/server/actions/invitations.test.ts)

### React Hook Test Example
[`src/hooks/__tests__/useOnlineStatus.test.ts`](file:///c:/User/USER/perks-app/src/hooks/__tests__/useOnlineStatus.test.ts)

### React Component Test Example
[`src/components/modules/marketplace/__tests__/OfflineBanner.test.tsx`](file:///c:/User/USER/perks-app/src/components/modules/marketplace/__tests__/OfflineBanner.test.tsx)

---

## Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest UI](https://vitest.dev/guide/ui.html)

### Useful Matchers

```typescript
// Equality
expect(value).toBe(expected);           // Strict equality (===)
expect(value).toEqual(expected);        // Deep equality
expect(value).not.toBe(expected);       // Negation

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(3.5);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.3);         // Floating point

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ key: 'value' });

// Functions
expect(fn).toThrow();
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(2);

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();

// DOM (with @testing-library/jest-dom)
expect(element).toBeInTheDocument();
expect(element).toHaveTextContent('text');
expect(element).toBeVisible();
```

---

## Next Steps

### For Epic 3

1. **Write escrow state machine tests** (100% coverage)
2. **Add Paystack integration tests** (mock API calls)
3. **Test Inngest cron jobs** (mock scheduler)
4. **Add E2E tests with Playwright** (user flows)

### Continuous Improvement

- Increase coverage to 80%+ across all modules
- Add more edge case tests
- Document testing patterns as they emerge
- Review and update this guide regularly

---

**Questions?** Ask Charlie (Senior Dev) or check the [Vitest docs](https://vitest.dev/).

**Last Updated:** 2025-11-25 by Charlie (Senior Dev)
