# Epic 4 Prep Sprint: Tax & Benefits Readiness

**Goal:** De-risk Epic 4 by validating PDF generation, clearing technical debt (Rate Limiting), and stabilizing tests.

**Duration:** 2 Days
**Participants:** Charlie (Dev), Dana (QA), Winston (Architect)

---

## 1. Technical Spike: PDF Generation Library <!-- id: 1 -->
**Objective:** Select and prototype the PDF library for Rent Receipts (Story 4.2) and Reports (Story 4.3).
- **Candidates:** `react-pdf` vs `pdfkit` vs `jspdf`.
- **Requirements:**
  - Server-side generation (Next.js Server Actions).
  - Custom styling (Official FIRS format).
  - Performance (low latency).
- **Deliverable:** A prototype script `scripts/prototype-pdf.ts` generating a sample receipt.

## 2. Technical Debt: Rate Limiting (Upstash Redis) <!-- id: 2 -->
**Objective:** Protect the API from abuse before adding Employer Dashboard load.
- **Scope:**
  - Install `@upstash/ratelimit` and `@upstash/redis`.
  - Implement `rateLimit` middleware for `/api/*` and Server Actions.
  - Configure limits (e.g., 10 req/10s for API, 5 req/hour for sensitive actions).
- **Deliverable:** Working rate limiting on a test route.

## 3. Maintenance: Fix Integration Tests <!-- id: 3 -->
**Objective:** Stabilize `scripts/test-dispute-flow.ts` to ensure reliable regression testing.
- **Issue:** Schema mismatches causing failures.
- **Fix:** Update script to match current `schema.ts`.
- **Deliverable:** `npm run test:dispute` passes consistently.

---

## Execution Plan

- [x] **Task 1:** PDF Generation Spike
- [x] **Task 2:** Rate Limiting Implementation
- [x] **Task 3:** Fix Integration Tests
