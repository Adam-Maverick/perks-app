# System-Level Test Design

**Project:** Stipends (perks-app)
**Date:** 2025-11-22
**Status:** Draft

## 1. System-Level Testability Assessment

### 1.1 Architecture Review
| Component | Testability Challenge | Mitigation Strategy | Risk Score |
| :--- | :--- | :--- | :--- |
| **Clerk (Auth)** | External dependency, rate limits, complex flows (2FA, SSO) | Use Clerk's testing tokens or mock auth state in Playwright (`storageState`). Avoid hitting real API in CI. | Medium |
| **Paystack (Payments)** | Financial transactions, webhooks, split payments | Use Paystack Test Mode keys. Mock webhooks for local/CI testing. Contract tests for API stability. | High |
| **Inngest (Cron/Queues)** | Asynchronous, time-dependent (14-day escrow) | Use Inngest Dev Server for local testing. Mock Inngest SDK in unit tests. Force run functions in E2E. | Medium |
| **Neon/Drizzle (DB)** | Serverless connection pooling | Use a dedicated test database (Dockerized Postgres or separate Neon branch) for integration tests. Transactional rollback for speed. | Low |
| **Serwist (PWA)** | Service worker caching, offline mode | Use Playwright's offline emulation. Validate SW registration and cache hits/misses. | Medium |
| **Resend (Email)** | Email delivery verification | Mock Resend API. Use a local SMTP catcher (e.g., Mailhog) or E2E email testing service (e.g., Mailosaur) if critical. | Low |

### 1.2 Architecturally Significant Requirements (ASRs)
| ID | Requirement | Test Strategy | Tooling |
| :--- | :--- | :--- | :--- |
| **ASR-001** | **Performance**: PWA FCP < 2s on 3G | Automated Lighthouse CI checks. Playwright tests with network throttling (Fast 3G). | Lighthouse, Playwright |
| **ASR-002** | **Security**: 2FA & NDPR Compliance | Security headers check. Dependency scanning. Authz tests for multi-tenant isolation (Org A cannot see Org B). Data retention policy tests (verify deletion). | OWASP ZAP (optional), Playwright (Authz), npm audit |
| **ASR-003** | **Reliability**: Offline Mode | E2E tests verifying read-only access when offline. Sync recovery tests (actions queued when offline are sent when online). | Playwright (`context.setOffline(true)`) |
| **ASR-004** | **Integrity**: Escrow Logic | High-coverage unit tests for state machine (HELD -> RELEASED/DISPUTED). Integration tests for Paystack split payments (verify correct amounts to merchant vs escrow). | Vitest, Jest |
| **ASR-005** | **Compliance**: Tax Reporting | Unit tests for tax calculation logic (150% deduction rules). Snapshot testing for generated report formats. | Vitest |

## 2. Test Levels Strategy

### 2.1 Unit Testing (Logic)
- **Scope**:
    - **Tax Logic**: `src/lib/tax-calculator.ts` (Complex deduction rules).
    - **Escrow State Machine**: `src/lib/escrow.ts` (Transitions, timeouts).
    - **UI Components**: `src/components/ui/*` (Atomic components).
- **Tools**: Vitest (fast, native TS support).
- **Coverage Target**: 80% for business logic, 100% for tax/escrow logic.

### 2.2 Integration Testing (Service/API)
- **Scope**:
    - **Server Actions**: `src/server/actions/*` (Verify DB updates, auth checks).
    - **Webhooks**: `src/app/api/webhooks/*` (Paystack/Clerk payload handling).
    - **Inngest Functions**: `src/inngest/*` (Cron schedules, event triggers).
- **Strategy**: "Sociable" integration tests using a real test DB (Dockerized Postgres). Mock external APIs (Clerk, Paystack) using `msw` or manual mocks.
- **Tools**: Vitest (with test DB fixture).

### 2.3 End-to-End Testing (Workflows)
- **Scope**: Critical User Journeys (CUJs).
    - **CUJ-1**: Employee Signup & Onboarding (Clerk -> DB Sync).
    - **CUJ-2**: Merchant Purchase with Escrow (Paystack Mock -> Transaction -> Escrow Hold).
    - **CUJ-3**: Employer Stipend Funding (Wallet Update).
    - **CUJ-4**: Offline Deal Browsing (PWA Cache).
- **Strategy**: Smoke tests for happy paths. Detailed flows for high-risk features (Escrow). Use "Network-First" patterns to avoid flakiness.
- **Tools**: Playwright.

## 3. NFR Assessment & Tooling

| Category | Requirement | Tool | Success Criteria |
| :--- | :--- | :--- | :--- |
| **Performance** | PWA Load Time | **Lighthouse CI** | Performance Score > 90, FCP < 2s (Mobile/3G). |
| **Performance** | API Latency | **k6** (Phase 2) | p95 < 500ms for critical endpoints (`/api/wallet/*`). |
| **Security** | Vulnerabilities | **npm audit** | 0 Critical/High vulnerabilities. |
| **Security** | Authz | **Playwright** | 100% pass on RBAC tests (e.g., "Employee cannot access Employer Dashboard"). |
| **Reliability** | Error Handling | **Playwright** | Graceful degradation on 500 errors (Custom Error Boundary shown). |
| **Reliability** | Offline | **Playwright** | "You are offline" indicator visible; read-only data accessible. |
| **Maintainability** | Code Quality | **ESLint / Prettier** | 0 linting errors. |

## 4. Testability Risks & Mitigations

| Risk | Impact | Mitigation | Owner |
| :--- | :--- | :--- | :--- |
| **Paystack Sandbox Reliability** | Flaky tests if sandbox is down or slow. | Implement a "Network-First" recording strategy (Har files) or use a pure mock for CI. Only hit real Sandbox in scheduled nightly builds. | QA Lead |
| **Clerk 2FA Testing** | Hard to automate SMS/Email 2FA. | Use Clerk's "Testing Tokens" to bypass 2FA in E2E tests. | Dev Lead |
| **Mobile Browser Fragmentation** | PWA might behave differently on older Android WebViews (common in Nigeria). | Use BrowserStack (Phase 2) for cross-browser testing on real devices. | QA Lead |
| **Inngest Local Dev** | Ensuring local dev environment matches production serverless behavior. | Use `inngest-cli` dev server in CI pipeline to simulate event handling. | DevOps |

## 5. Definition of Done for Testing
- [ ] Unit tests written for all new business logic (Tax, Escrow).
- [ ] Integration tests covering happy path for all Server Actions.
- [ ] Critical User Journeys (CUJs) covered by E2E smoke tests.
- [ ] NFR checks (Lighthouse, Lint) passing in CI.
