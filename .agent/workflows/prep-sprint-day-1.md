---
description: Day 1 - Testing Infrastructure Setup
---

# Prep Sprint Day 1: Testing Infrastructure Setup

**Owner:** Charlie (Senior Dev)  
**Date:** 2025-11-25  
**Estimated Effort:** 1 full day  
**Success Criteria:** At least 5 passing tests, CI running, Lighthouse results documented

---

## Context

From Epic 2 Retrospective:
- **Production bug:** Browse Deals button broken, caught by Project Lead (not tests)
- **Testing gap:** Vitest configured but never used, 100% reliance on manual testing
- **Epic 3 blocker:** Story 3.1 requires "Unit tests with Vitest (100% coverage target)"
- **Risk:** Cannot ship money-handling code without automated tests
- **Action item completion rate:** 14% (1 of 7) - we need to finish what we commit to

**Goal:** Establish testing infrastructure and patterns before Epic 3 starts.

---

## Tasks

### 1. Configure Vitest Properly

**Owner:** Charlie (Senior Dev)  
**Estimated Time:** 1 hour

**Current State:**
- `vitest.config.ts` exists but may not be fully configured
- No tests written yet
- No test scripts in `package.json`

**Actions:**
- [ ] Review current `vitest.config.ts` configuration
- [ ] Verify test environment setup (jsdom for React components)
- [ ] Configure path aliases to match `tsconfig.json`
- [ ] Set up coverage reporting (v8 or istanbul)
- [ ] Add test scripts to `package.json`:
  ```json
  {
    "scripts": {
      "test": "vitest",
      "test:ui": "vitest --ui",
      "test:coverage": "vitest --coverage"
    }
  }
  ```
- [ ] Install missing dependencies if needed:
  ```bash
  npm install -D @vitest/ui @vitest/coverage-v8
  ```
- [ ] Run `npm test` to verify configuration works

**Output:**
- Working Vitest configuration
- Test scripts ready to use
- Configuration documented in testing patterns doc

---

### 2. Create First Test Suite - Validators & Utilities

**Owner:** Charlie (Senior Dev)  
**Estimated Time:** 2 hours

**Goal:** Write at least 5 passing tests for existing code (validators, utilities, helpers)

**Recommended Test Files:**

#### A. Email Validator Tests (`lib/validators/__tests__/email.test.ts`)
```typescript
import { describe, it, expect } from 'vitest'
import { validateEmail } from '../email'

describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true)
    expect(validateEmail('test.user@company.co.uk')).toBe(true)
  })

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('user@')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
  })

  it('should handle edge cases', () => {
    expect(validateEmail('')).toBe(false)
    expect(validateEmail('user@example')).toBe(false)
  })
})
```

#### B. Currency Formatter Tests (`lib/utils/__tests__/currency.test.ts`)
```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../currency'

describe('formatCurrency', () => {
  it('should format Nigerian Naira correctly', () => {
    expect(formatCurrency(50000)).toBe('₦50,000')
    expect(formatCurrency(1000)).toBe('₦1,000')
  })

  it('should handle zero and negative values', () => {
    expect(formatCurrency(0)).toBe('₦0')
    expect(formatCurrency(-5000)).toBe('-₦5,000')
  })

  it('should handle decimal values', () => {
    expect(formatCurrency(1234.56)).toBe('₦1,234.56')
  })
})
```

#### C. Date Formatter Tests (`lib/utils/__tests__/date.test.ts`)
```typescript
import { describe, it, expect } from 'vitest'
import { formatDate, isExpired } from '../date'

describe('formatDate', () => {
  it('should format dates correctly', () => {
    const date = new Date('2025-11-25T10:00:00Z')
    expect(formatDate(date)).toBe('Nov 25, 2025')
  })
})

describe('isExpired', () => {
  it('should detect expired dates', () => {
    const pastDate = new Date('2020-01-01')
    const futureDate = new Date('2030-01-01')
    expect(isExpired(pastDate)).toBe(true)
    expect(isExpired(futureDate)).toBe(false)
  })
})
```

#### D. String Utilities Tests (`lib/utils/__tests__/string.test.ts`)
```typescript
import { describe, it, expect } from 'vitest'
import { slugify, truncate } from '../string'

describe('slugify', () => {
  it('should convert strings to URL-friendly slugs', () => {
    expect(slugify('Hello World')).toBe('hello-world')
    expect(slugify('Test & Example')).toBe('test-example')
  })
})

describe('truncate', () => {
  it('should truncate long strings', () => {
    expect(truncate('This is a long string', 10)).toBe('This is a...')
    expect(truncate('Short', 10)).toBe('Short')
  })
})
```

#### E. Array Utilities Tests (`lib/utils/__tests__/array.test.ts`)
```typescript
import { describe, it, expect } from 'vitest'
import { groupBy, unique } from '../array'

describe('groupBy', () => {
  it('should group array items by key', () => {
    const items = [
      { category: 'food', name: 'Pizza' },
      { category: 'food', name: 'Burger' },
      { category: 'tech', name: 'Laptop' }
    ]
    const grouped = groupBy(items, 'category')
    expect(grouped.food).toHaveLength(2)
    expect(grouped.tech).toHaveLength(1)
  })
})

describe('unique', () => {
  it('should remove duplicates from array', () => {
    expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
    expect(unique(['a', 'b', 'a'])).toEqual(['a', 'b'])
  })
})
```

**Actions:**
- [ ] Identify existing validators and utilities in codebase
- [ ] Create `__tests__` directories next to source files
- [ ] Write at least 5 test files with multiple test cases each
- [ ] Ensure all tests pass: `npm test`
- [ ] Verify coverage: `npm run test:coverage`
- [ ] Aim for >80% coverage on tested utilities

**Output:**
- At least 5 passing test files
- Coverage report showing tested code
- Confidence in testing setup

---

### 3. Set Up GitHub Actions CI/CD

**Owner:** Charlie (Senior Dev)  
**Estimated Time:** 1.5 hours

**Goal:** Run tests automatically on every commit and pull request

**Actions:**
- [ ] Create `.github/workflows/test.yml`:
  ```yaml
  name: Tests

  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main, develop]

  jobs:
    test:
      runs-on: ubuntu-latest

      steps:
        - uses: actions/checkout@v4
        
        - name: Setup Node.js
          uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'
        
        - name: Install dependencies
          run: npm ci
        
        - name: Run tests
          run: npm test -- --run
        
        - name: Generate coverage report
          run: npm run test:coverage
        
        - name: Upload coverage to Codecov (optional)
          uses: codecov/codecov-action@v3
          with:
            files: ./coverage/coverage-final.json
            flags: unittests
            name: codecov-umbrella
  ```

- [ ] Create `.github/workflows/lint.yml` (optional but recommended):
  ```yaml
  name: Lint

  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main, develop]

  jobs:
    lint:
      runs-on: ubuntu-latest

      steps:
        - uses: actions/checkout@v4
        
        - name: Setup Node.js
          uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'
        
        - name: Install dependencies
          run: npm ci
        
        - name: Run ESLint
          run: npm run lint
        
        - name: Run TypeScript check
          run: npx tsc --noEmit
  ```

- [ ] Commit and push workflows to GitHub
- [ ] Verify workflows run successfully in GitHub Actions tab
- [ ] Add status badges to README.md (optional):
  ```markdown
  ![Tests](https://github.com/Adam-Maverick/perks-app/workflows/Tests/badge.svg)
  ![Lint](https://github.com/Adam-Maverick/perks-app/workflows/Lint/badge.svg)
  ```

**Output:**
- CI/CD pipeline running on every commit
- Tests must pass before merge
- Automated quality gates in place

---

### 4. Document Testing Patterns for Team

**Owner:** Charlie (Senior Dev)  
**Estimated Time:** 1.5 hours

**Goal:** Create clear testing guidelines so the whole team can write tests

**Actions:**
- [ ] Create `docs/testing-guide.md` with sections:
  - **Testing Philosophy:** Why we test, what we test, coverage goals
  - **Unit Tests:** Testing pure functions, validators, utilities
  - **Integration Tests:** Testing API routes, database operations
  - **E2E Tests:** Testing user flows with Playwright (future)
  - **Test Structure:** Arrange-Act-Assert pattern, describe/it blocks
  - **Mocking:** How to mock database, external APIs, Next.js modules
  - **Coverage Goals:** 80% for utilities, 100% for financial logic
  - **Running Tests:** Commands, watch mode, coverage reports
  - **CI/CD:** How tests run in GitHub Actions
  - **Best Practices:** Test naming, test isolation, avoiding flaky tests

- [ ] Add examples for each test type
- [ ] Document common testing patterns:
  ```typescript
  // Testing async functions
  it('should fetch user data', async () => {
    const user = await getUserById('123')
    expect(user.name).toBe('John Doe')
  })

  // Testing error handling
  it('should throw error for invalid input', () => {
    expect(() => validateEmail('invalid')).toThrow()
  })

  // Testing React components (future)
  it('should render button correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
  ```

- [ ] Add troubleshooting section for common issues
- [ ] Link to Vitest documentation for advanced usage

**Output:**
- Complete testing guide in `docs/testing-guide.md`
- Team can write tests independently
- Consistent testing patterns across codebase

---

### 5. Run Lighthouse PWA Audit

**Owner:** Dana (QA Engineer)  
**Estimated Time:** 30 minutes  
**When:** Afternoon (parallel with Charlie's work)

**Goal:** Verify NFR1 (FCP < 2s on 3G) and PWA score > 90

**Actions:**
- [ ] Open Vercel deployment URL in Chrome
- [ ] Open Chrome DevTools → Lighthouse tab
- [ ] Configure audit:
  - Mode: Navigation
  - Device: Mobile
  - Categories: Performance, PWA, Accessibility, Best Practices, SEO
  - Throttling: Simulated 3G
- [ ] Run audit and wait for results
- [ ] Capture screenshot of results
- [ ] Document findings in `docs/lighthouse-audit-results.md`:
  - Performance score (target: >90)
  - FCP (First Contentful Paint) - target: <2s on 3G
  - PWA score (target: >90)
  - Accessibility score
  - Best Practices score
  - SEO score
  - Any warnings or recommendations
- [ ] If scores below target, create action items for Epic 3 or later

**Output:**
- Lighthouse audit results documented
- PWA compliance verified
- Performance baseline established

---

### 6. Verify Browse Deals Hotfix in Production

**Owner:** Dana (QA Engineer)  
**Estimated Time:** 15 minutes  
**When:** Afternoon (after Lighthouse audit)

**Goal:** Confirm the Browse Deals button navigation fix is working in production

**Actions:**
- [ ] Open Vercel deployment URL
- [ ] Log in as employee (use test account)
- [ ] Navigate to employee dashboard
- [ ] Click "Browse Deals" button
- [ ] Verify navigation to `/dashboard/employee/marketplace`
- [ ] Verify marketplace page loads correctly
- [ ] Test on both desktop and mobile viewports
- [ ] Document verification in Epic 2 retrospective or create verification note

**Output:**
- Hotfix verified working
- Production bug resolved
- User flow restored

---

### 7. Set Coverage Thresholds (Optional but Recommended)

**Owner:** Charlie (Senior Dev)  
**Estimated Time:** 15 minutes

**Goal:** Enforce minimum test coverage in CI/CD

**Actions:**
- [ ] Add coverage thresholds to `vitest.config.ts`:
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
          statements: 80
        },
        exclude: [
          'node_modules/',
          'dist/',
          '**/*.config.ts',
          '**/*.d.ts',
          '**/types.ts'
        ]
      }
    }
  })
  ```

- [ ] Update GitHub Actions workflow to fail if coverage below threshold
- [ ] Document coverage requirements in testing guide

**Output:**
- Coverage thresholds enforced
- Quality gates in place
- Cannot merge code that reduces coverage

---

## Success Criteria

- [ ] Vitest properly configured with test scripts
- [ ] At least 5 passing test files (validators, utilities)
- [ ] GitHub Actions CI/CD running tests on every commit
- [ ] Testing patterns documented in `docs/testing-guide.md`
- [ ] Lighthouse PWA audit complete and documented
- [ ] Browse Deals hotfix verified in production
- [ ] Coverage thresholds set (optional)

---

## Timeline

**Total Time:** ~8 hours (1 full day)

| Task | Owner | Time | Start | End |
|------|-------|------|-------|-----|
| Configure Vitest | Charlie | 1h | 9:00 | 10:00 |
| Write First Test Suite | Charlie | 2h | 10:00 | 12:00 |
| **Lunch Break** | - | 1h | 12:00 | 13:00 |
| Set Up GitHub Actions CI/CD | Charlie | 1.5h | 13:00 | 14:30 |
| Document Testing Patterns | Charlie | 1.5h | 14:30 | 16:00 |
| Set Coverage Thresholds | Charlie | 0.25h | 16:00 | 16:15 |
| **Buffer for issues** | Charlie | 0.75h | 16:15 | 17:00 |
| Run Lighthouse Audit | Dana | 0.5h | 14:00 | 14:30 |
| Verify Browse Deals Hotfix | Dana | 0.25h | 14:30 | 14:45 |

---

## Dependencies

**Prerequisites:**
- ✅ Vitest already installed (in `package.json`)
- ✅ `vitest.config.ts` exists
- ✅ Vercel deployment live for testing
- ✅ Browse Deals hotfix deployed

**Blockers:**
- None expected - all setup and documentation tasks

---

## Deliverables

1. **Working Test Infrastructure**
   - Vitest configured and running
   - At least 5 passing test files
   - Coverage reporting enabled

2. **CI/CD Pipeline**
   - GitHub Actions running tests on every commit
   - Tests must pass before merge
   - Coverage thresholds enforced

3. **Testing Documentation**
   - Complete testing guide in `docs/testing-guide.md`
   - Team can write tests independently
   - Consistent patterns established

4. **Quality Verification**
   - Lighthouse audit results documented
   - Browse Deals hotfix verified
   - PWA compliance confirmed

5. **Readiness for Day 2**
   - Testing infrastructure complete
   - Team can proceed with Epic 3 research
   - Confidence in code quality

---

## Notes

- **Focus:** Infrastructure and patterns, not comprehensive coverage
- **Goal:** Establish foundation for Epic 3's 100% coverage requirement
- **Outcome:** Team can write tests confidently, CI/CD prevents regressions
- **Next Step:** Day 2 - Epic 3 technical spike (Paystack, Inngest, escrow design)

---

## Epic 3 Readiness

After Day 1 completion, we'll have:
- ✅ Testing infrastructure ready for Story 3.1 (Escrow State Machine with 100% coverage)
- ✅ CI/CD preventing production bugs like Browse Deals button
- ✅ Testing patterns documented for team
- ✅ Quality gates enforced
- ✅ Confidence to ship money-handling code

**Story 3.1 Requirement:** "Unit tests with Vitest (100% coverage target for escrow state machine)"

**We'll be ready.** ✅

---

**Charlie:** "Let's build this testing foundation properly. Epic 3 depends on it."

**Dana:** "I'll verify the Lighthouse scores and hotfix this afternoon. Looking forward to having real tests."

**Adam:** "This is the prep work we should've done before Epic 2. Let's finish what we commit to."
