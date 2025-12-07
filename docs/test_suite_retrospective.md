# Test Suite Retrospective: Resolving Vitest Configuration & Logic Issues

**Date:** 2025-12-05
**Topic:** Vitest "No Test Suite Found" Errors & Assertion Failures

## 1. Executive Summary

The project experienced widespread test failures, primarily characterized by "No test suite found" errors in valid test files, along with specific logic failures in server actions. After investigation, the root cause was identified as a conflict between Vitest's global configuration and explicit imports in test files, exacerbated by Next.js `"use server"` transformation. All 23 test files (126 tests) are now passing.

## 2. Root Cause Analysis

### A. The Configuration Conflict (Primary Issue)
*   **Symptom:** Tests failed with `Error: No test suite found in file ...` despite containing valid tests.
*   **Cause:** The `vitest.config.ts` was set with `globals: true`. However, test files explicitly imported Vitest primitives: `import { describe, it, vi } from 'vitest'`.
*   **Impact:** When testing Next.js Server Actions (files with `"use server"` directive), the compiler transformation interfered with Vitest's mock hoisting mechanism when explicit imports were present. This caused Vitest to fail to detect the test suite definitions.

### B. Infrastructure Gaps
*   **Window Object:** Component tests (e.g., `TaxShieldWidget`) failed because `jsdom` does not implement `window.matchMedia` by default.
*   **Env Variables:** Initial attempts to mock environment variables (like `PAYSTACK_SECRET_KEY`) failed because modules read `process.env` at load time (top-level scope) rather than runtime (function scope), causing mocks to be ignored.

### C. Test Data & Scoping
*   **Invalid Data:** Server actions using Zod validation failed because test data used simple strings (e.g., `'id-123'`) instead of valid UUIDs/CUIDs required by the schema.
*   **Variable Scoping:** Mock variables (e.g., `mockTransaction`) defined inside specific `describe` blocks were accessed by other blocks, causing `ReferenceError`.

## 3. Resolution Steps

### Configuration Fixes
1.  **Removed Explicit Imports:** Systematically removed `import { ... } from 'vitest'` from **17 test files**.
2.  **Standardized on Globals:** Relied on the global `describe`, `it`, `expect`, and `vi` injected by the configuration.

### Infrastructure Fixes
1.  **Updated `vitest.setup.ts`:** Added a polyfill for `window.matchMedia` that safely checks for the `window` object (to avoid breaking server-side tests).
2.  **Runtime Env Access:** Refactored `payments.ts` to read `process.env.PAYSTACK_SECRET_KEY` inside the function body, allowing `vi.stubEnv` to work correctly.

### Logic & Data Fixes
1.  **Valid Test Data:** Updated `disputes.test.ts` to use proper v4 UUIDs that pass Zod validation.
2.  **Scope Correction:** Moved shared mock data objects to the top-level `describe` scope in `payments.test.ts` to ensure availability across all tests.
3.  **Assertion Alignment:** Updated `TaxShieldWidget` tests to check for skeleton UI classes (`animate-pulse`) instead of non-existent loading text.

## 4. Prevention Strategy

To prevent recurrence, we recommend the following standards:

### ✅ Do:
*   **Use Globals:** Always use `descibe`, `it`, `vi` directly without importing them.
*   **Mock at Boundaries:** For Server Actions, mock the module boundary or use specialized setups rather than testing internal implementation details if possible.
*   **Valid Data Factories:** Use helper functions to generate test data that satisfies schema requirements (UUIDs, email formats) automatically.
*   **Runtime Config:** Access environment variables (`process.env`) inside functions, not at the module top-level.

### ❌ Don't:
*   **Explicit Imports:** Do not write `import { ... } from 'vitest'`.
*   **Hardcoded Invalid IDs:** Avoid `'test-id'` if the schema expects a UUID.
*   **Global State Leaks:** Ensure `vi.clearAllMocks()` is called in `beforeEach` (configured in setup) to prevent test polution.
