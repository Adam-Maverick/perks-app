# Infrastructure: Fix Vitest jsdom Environment for Component Tests

Status: backlog

## Story

As a **developer**,
I want the vitest test environment properly configured for React component tests,
So that all 20+ blocked test files can run successfully.

## Problem Statement

The current `vitest.config.ts` uses `environment: 'node'` which prevents React component tests from running. Component tests require jsdom for DOM APIs and `@testing-library/jest-dom` matchers.

**Impact:** 20 of 23 test files fail with "No test suite found" error.

## Acceptance Criteria

1. **Given** a React component test file with jsdom directive
   **When** running `npm test`
   **Then** the test executes successfully with DOM APIs available

2. **And** `toBeInTheDocument()` and other jest-dom matchers work globally

3. **And** Existing node-only tests (inngest, server actions) continue to pass

4. **And** Tests can use `window.matchMedia` and other browser APIs

## Tasks

- [ ] Create `vitest.setup.ts` with jest-dom import
- [ ] Update `vitest.config.ts` to include setup file
- [ ] Configure environment override for component test directories
- [ ] Verify all 23 test files pass
- [ ] Document testing patterns in README or docs

## Technical Approach

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom';

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
```

```typescript
// vitest.config.ts updates
export default defineConfig({
  test: {
    environment: 'jsdom', // Change from 'node'
    setupFiles: ['./vitest.setup.ts'],
    // Or use environmentMatchGlobs for selective environments
  },
});
```

## Blocked Test Files

- `src/components/modules/dashboard/__tests__/TaxShieldWidget.test.tsx`
- `src/components/modules/marketplace/__tests__/OfflineBanner.test.tsx`
- `src/hooks/queries/__tests__/useEmployeeTaxContribution.test.tsx`
- `src/server/actions/__tests__/payments.test.ts`
- `src/server/actions/__tests__/sanity.test.ts`
- `src/app/api/webhooks/paystack/__tests__/route.test.ts`
- And 14 others...

## References

- [Vitest Environment Configuration](https://vitest.dev/guide/environment.html)
- [Testing Library Jest DOM](https://testing-library.com/docs/ecosystem-jest-dom/)
