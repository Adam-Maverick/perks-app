# Stipends - Epic Breakdown

**Author:** Adam
**Date:** 2025-11-22
**Project Level:** Enterprise
**Target Scale:** 100+ Employers

---

## Overview

This document provides the complete epic and story breakdown for Stipends, decomposing the requirements from the [PRD](./PRD.md) into implementable stories.

**Living Document Notice:** This is the initial version. It will be updated after UX Design and Architecture workflows add interaction and technical details to stories.

## Epic Summary

| Epic | Title | Goal | FR Coverage |
| :--- | :--- | :--- | :--- |
| **1** | **Foundation & Onboarding** | Establish core infrastructure and enable secure user access with SSO and account portability. | FR1, FR2 |
| **2** | **Verified Marketplace** | Enable employees to discover, search, and view verified deals from trusted merchants. | FR4, FR9, FR10 |
| **3** | **Escrow Protection** | Secure transactions with emerging merchants to build trust via hold-and-release logic. | FR5, FR6, FR7, FR8, FR11 |
| **4** | **Tax & Benefits** | Deliver tax optimization value to employers and employees through compliance reporting and savings visualization. | FR3, FR14, FR15 |
| **5** | **Employee Wallet & Stipends** | Enable employer-funded spending and wallet management. | FR13 |
| **6** | **Employer Admin** | Empower employers to manage workforce and view analytics. | FR12 |

---

## Functional Requirements Inventory

- **FR1**: Employees can create accounts via Employer SSO or unique invitation code.
- **FR2**: **Debt Portability**: Employees can transfer their account, history, and active balances to a new employer code.
- **FR3**: **Tax Shield View**: Employees can view their personal contribution to their employer's tax savings.
- **FR4**: Merchant directory with "Verified" and "Emerging" badges.
- **FR5**: **Auto-apply Escrow** to Emerging Brands (new/unverified merchants).
- **FR6**: Employee confirmation workflow (app/QR) to release funds.
- **FR7**: Evidence-based dispute resolution within 14-day window.
- **FR8**: **Auto-Release**: System releases funds after 14 days of inactivity.
- **FR9**: Deal browsing with category filters (Food, Transport, Utilities).
- **FR10**: Search functionality with location-based recommendations.
- **FR11**: Notification reminders on Day 7 and 12 to confirm delivery.
- **FR12**: Employee roster management (CSV upload or HR system API sync).
- **FR13**: Stipend wallet funding and allocation.
- **FR14**: Rent receipt generation for employee tax relief.
- **FR15**: Employer welfare spending report (50% additional deduction).

---

## FR Coverage Map

- **FR1** → Epic 1 (Foundation)
- **FR2** → Epic 1 (Foundation)
- **FR3** → Epic 4 (Tax & Benefits)
- **FR4** → Epic 2 (Marketplace)
- **FR5** → Epic 3 (Escrow)
- **FR6** → Epic 3 (Escrow)
- **FR7** → Epic 3 (Escrow)
- **FR8** → Epic 3 (Escrow)
- **FR9** → Epic 2 (Marketplace)
- **FR10** → Epic 2 (Marketplace)
- **FR11** → Epic 3 (Escrow)
- **FR12** → Epic 6 (Employer Admin)
- **FR13** → Epic 5 (Wallet)
- **FR14** → Epic 4 (Tax & Benefits)
- **FR15** → Epic 4 (Tax & Benefits)

---

## Epic 1: Foundation & Onboarding

**Goal:** Establish core infrastructure and enable secure user access with SSO and account portability.

**Value Delivered:** Users can register, log in, and maintain their account across employer changes.

---

### Story 1.1: Project Initialization & PWA Setup

As a **developer**,
I want to initialize the Next.js project with PWA capabilities,
So that we have a solid foundation for all subsequent features.

**Acceptance Criteria:**

**Given** I am setting up the project for the first time
**When** I run the initialization commands
**Then** the project structure matches `architecture.md` specifications
**And** PWA manifest and service worker are configured via Serwist
**And** Tailwind CSS is configured with the approved color palette (Electric Royal Blue #2563EB, Vibrant Coral #FA7921, Electric Lime #96E072)
**And** TypeScript, ESLint, and Prettier are configured
**And** The app loads on localhost with a "Coming Soon" placeholder page
**And** Lighthouse PWA audit scores 90+ (installability, offline shell)

**Prerequisites:** None (first story)

**Technical Notes:**
- Execute: `npx create-next-app@latest perks-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- Install Serwist: `npm install @serwist/next @serwist/precaching @serwist/sw`
- Configure `tailwind.config.ts` with UX Design color tokens
- Set up `next.config.ts` with Serwist plugin
- Create `public/manifest.json` with app metadata
- Verify offline shell works (service worker caches App Shell)

---

### Story 1.2: Database Schema & Clerk Integration

As a **developer**,
I want to set up the database schema and Clerk authentication,
So that users can securely register and log in.

**Acceptance Criteria:**

**Given** the project is initialized
**When** I configure Neon and Clerk
**Then** the database connection is established via Drizzle ORM
**And** Clerk is configured with Organization support (for Employers)
**And** The following tables exist: `users`, `organizations`, `employees`, `employers`
**And** Clerk webhooks sync user data to our database on `user.created` and `organization.created` events
**And** Middleware protects all `/dashboard/*` routes requiring authentication
**And** A test user can sign up via Clerk and see their record in the `users` table

**Prerequisites:** Story 1.1

**Technical Notes:**
- Create Neon database and add `DATABASE_URL` to `.env.local`
- Define Drizzle schema in `src/db/schema.ts` (users, organizations, employees, employers)
- Run `npx drizzle-kit push` to create tables
- Set up Clerk project and add API keys to `.env.local`
- Implement webhook handler at `/api/webhooks/clerk` with signature verification
- Create middleware to protect dashboard routes
- Test: Sign up via Clerk UI → verify user record in DB

---

### Story 1.3: Employee SSO Registration

As an **employee**,
I want to register using my company email via SSO,
So that I can access the platform with minimal friction.

**Acceptance Criteria:**

**Given** I am a new employee at a registered employer
**When** I visit the registration page and enter my company email
**Then** I am redirected to Clerk's SSO flow
**And** I can authenticate using my company's identity provider (Google Workspace, Microsoft 365)
**And** My account is automatically linked to my employer's organization in Clerk
**And** I am redirected to the employee dashboard after successful authentication
**And** My profile shows my name, email, and employer name
**And** The entire flow completes in under 2 minutes

**Prerequisites:** Story 1.2

**Technical Notes:**
- Configure Clerk Organizations with SSO connections (Google, Microsoft)
- Create `/signup` route with Clerk's `<SignUp />` component
- Implement post-signup redirect to `/dashboard/employee`
- Create `EmployeeProfile` component displaying user metadata
- Add email domain validation (only allow registered employer domains)
- Test with multiple SSO providers

---

### Story 1.4: Invitation Code Registration (Fallback)

As an **employee at a company without SSO**,
I want to register using a unique invitation code,
So that I can still access the platform.

**Acceptance Criteria:**

**Given** my employer does not have SSO configured
**When** I visit the registration page and enter my invitation code
**Then** the system validates the code against the `invitations` table
**And** I can create an account with email/password
**And** My account is linked to the correct employer organization
**And** The invitation code is marked as "used" and cannot be reused
**And** I receive a welcome email with next steps
**And** I am redirected to the employee dashboard

**Prerequisites:** Story 1.2

**Technical Notes:**
- Create `invitations` table (code, employer_id, email, used_at)
- Add invitation code input to `/signup` page
- Implement Server Action `validateInvitationCode(code: string)`
- Link user to organization after successful signup
- Send welcome email via Resend
- Add rate limiting (max 5 attempts per IP per hour)

---

### Story 1.5: Account Portability (Employer Transfer)

As an **employee who changes jobs**,
I want to transfer my account to my new employer,
So that I retain my transaction history and don't lose my data.

**Acceptance Criteria:**

**Given** I have an existing account linked to Employer A
**When** I receive a new invitation code from Employer B
**And** I enter the code in my account settings
**Then** the system validates the code and confirms the transfer
**And** My account is unlinked from Employer A's organization
**And** My account is linked to Employer B's organization
**And** My transaction history and wallet balance are preserved
**And** I receive a confirmation email about the transfer
**And** Employer A's admin sees me as "Transferred" in their roster

**Prerequisites:** Story 1.4

**Technical Notes:**
- Create `/dashboard/employee/settings/transfer` page
- Implement Server Action `transferEmployer(invitationCode: string)`
- Update `employees` table with new `organization_id`
- Preserve `transactions` and `wallets` records (foreign key to user, not org)
- Send notification emails to both old and new employers
- Add audit log entry for compliance (NDPR requirement)
- Test: User transfers → old employer loses access → new employer gains access

---


## Epic 2: Verified Marketplace

**Goal:** Enable employees to discover, search, and view verified deals from trusted merchants.

**Value Delivered:** Employees can browse and find deals from vetted merchants with trust badges and offline access.

---

### Story 2.1: Merchant Data Model & Seed Data

As a **developer**,
I want to create the merchant and deals data model,
So that we can store and display marketplace content.

**Acceptance Criteria:**

**Given** the database is initialized
**When** I define the merchant schema
**Then** the following tables exist: `merchants`, `deals`, `categories`, `merchant_badges`
**And** Each merchant has fields: name, description, logo_url, trust_level (VERIFIED/EMERGING), location, contact_info
**And** Each deal has fields: title, description, discount_percentage, original_price, category_id, merchant_id, valid_until, inventory_count
**And** Categories include: Food, Transport, Utilities, Electronics, Wellness
**And** I can seed the database with 10 test merchants (5 VERIFIED, 5 EMERGING) and 30 deals
**And** All foreign keys and indexes are properly configured

**Prerequisites:** Story 1.2

**Technical Notes:**
- Define schemas in `src/db/schema.ts`
- Create `merchants` table with trust_level enum
- Create `deals` table with merchant_id foreign key
- Create `categories` table (pre-populated with 5 categories)
- Create seed script `src/db/seed.ts` with realistic Nigerian merchant data
- Run `npx drizzle-kit push` and `npm run db:seed`

---

### Story 2.2: Merchant Directory Page

As an **employee**,
I want to view a directory of all verified merchants,
So that I can discover trusted brands offering deals.

**Acceptance Criteria:**

**Given** I am logged in as an employee
**When** I navigate to `/dashboard/employee/marketplace`
**Then** I see a grid of merchant cards (logo, name, trust badge, deal count)
**And** VERIFIED merchants display a green checkmark badge
**And** EMERGING merchants display an orange "Escrow Protected" badge
**And** Each card shows the number of active deals (e.g., "12 deals available")
**And** Clicking a merchant card navigates to `/dashboard/employee/marketplace/[merchantId]`
**And** The page loads in under 2 seconds on 3G
**And** The UI matches the UX Design spec (Outfit headings, Inter body, Electric Royal Blue primary color)

**Prerequisites:** Story 2.1

**Technical Notes:**
- Create `(dashboard)/employee/marketplace/page.tsx`
- Fetch merchants using Server Component (no client-side fetching for initial load)
- Create `MerchantCard` component in `src/components/modules/marketplace`
- Use `next/image` for merchant logos with lazy loading
- Implement trust badge logic (VERIFIED = green checkmark, EMERGING = orange shield)
- Add skeleton loading states
- Test: Verify Lighthouse Performance score > 90

---

### Story 2.3: Deal Browsing with Category Filters

As an **employee**,
I want to filter deals by category (Food, Transport, Utilities),
So that I can quickly find relevant offers.

**Acceptance Criteria:**

**Given** I am on the marketplace page
**When** I click a category filter (e.g., "Food")
**Then** the deal list updates to show only Food deals
**And** The active category is visually highlighted (Vibrant Coral #FA7921)
**And** Each deal card displays: merchant logo, deal title, discount percentage, original price, "Get Deal" CTA
**And** The filter updates the URL query parameter (e.g., `?category=food`)
**And** Refreshing the page preserves the selected category
**And** The "All" filter shows deals from all categories
**And** The filter transition is smooth (no layout shift)

**Prerequisites:** Story 2.2

**Technical Notes:**
- Add category filter buttons to marketplace page
- Use URL search params for filter state (`useSearchParams`)
- Create `DealCard` component with discount badge
- Implement Server Component filtering (no client-side JS for filter logic)
- Use Tailwind's `data-[state=active]` for active filter styling
- Add "All" option to clear filters
- Test: Navigate with filters → refresh → filter persists

---

### Story 2.4: Search Functionality with Location Recommendations

As an **employee**,
I want to search for deals by keyword or merchant name,
So that I can quickly find specific offers.

**Acceptance Criteria:**

**Given** I am on the marketplace page
**When** I type "pizza" in the search bar
**Then** the deal list updates in real-time to show matching deals
**And** Search matches deal titles, merchant names, and descriptions (case-insensitive)
**And** If my location is set (Lagos, Ikeja), local merchants are prioritized in results
**And** The search query is reflected in the URL (`?q=pizza`)
**And** Clearing the search shows all deals again
**And** If no results are found, I see a helpful message: "No deals found for 'pizza'. Try 'Food' category?"
**And** Search debounces input (waits 300ms after typing stops)

**Prerequisites:** Story 2.3

**Technical Notes:**
- Add search input to marketplace page header
- Implement debounced search using `useDebouncedValue` hook
- Use Server Action `searchDeals(query: string, location?: string)` for search logic
- Implement full-text search in Postgres (using `ILIKE` or `tsvector`)
- Add location detection (use browser geolocation API or IP-based fallback)
- Create empty state component with category suggestions
- Test: Search → verify debouncing → verify location prioritization

---

### Story 2.5: Offline Deal Caching (PWA)

As an **employee with poor network connectivity**,
I want to view previously loaded deals offline,
So that I can browse even without internet access.

**Acceptance Criteria:**

**Given** I have previously visited the marketplace page while online
**When** I go offline (airplane mode or network failure)
**And** I navigate to `/dashboard/employee/marketplace`
**Then** I see the cached deals from my last visit
**And** A banner displays: "You are offline. Showing cached deals."
**And** Deal images load from the cache (no broken images)
**And** I can click on deals to view details (cached data only)
**And** The "Get Deal" button is disabled with a tooltip: "Available when online"
**And** When I go back online, the banner disappears and fresh data loads

**Prerequisites:** Story 1.1, Story 2.2

**Technical Notes:**
- Configure Serwist to cache marketplace API responses
- Use `workbox-precaching` for static assets (images, CSS, JS)
- Implement runtime caching strategy for `/api/deals` (Network-First, fallback to Cache)
- Add offline detection using `navigator.onLine` and `online`/`offline` events
- Create `OfflineBanner` component
- Disable CTAs when offline (use `disabled` attribute)
- Test: Load marketplace → go offline → verify cached content → go online → verify fresh data

---


## Epic 3: Escrow Protection

**Goal:** Secure transactions with emerging merchants to build trust via hold-and-release logic.

**Value Delivered:** Employees can purchase from new merchants with confidence, knowing funds are protected until delivery is confirmed.

---

### Story 3.1: Escrow State Machine (Core Logic)

As a **developer**,
I want to implement the escrow state machine,
So that funds can be held and released based on business rules.

**Acceptance Criteria:**

**Given** the database schema supports escrow
**When** I implement the state machine
**Then** the `escrow_holds` table tracks states: HELD, RELEASED, DISPUTED, REFUNDED
**And** State transitions follow rules: HELD → RELEASED (on confirmation) | HELD → DISPUTED (on dispute) | DISPUTED → RELEASED/REFUNDED (on resolution)
**And** Auto-release triggers after 14 days of inactivity (HELD → RELEASED)
**And** All state changes are logged in `escrow_audit_log` with timestamps and actor_id
**And** Unit tests cover all state transitions and edge cases (e.g., double-release attempts)
**And** The state machine is implemented in `src/lib/escrow-state-machine.ts`

**Prerequisites:** Story 2.1

**Technical Notes:**
- Create `escrow_holds` table (transaction_id, merchant_id, amount, state, held_at, released_at)
- Create `escrow_audit_log` table for compliance
- Implement state machine using TypeScript enums and switch statements
- Add validation: prevent invalid transitions (e.g., RELEASED → HELD)
- Create Inngest function `autoReleaseEscrow` scheduled daily to check for 14-day holds
- Write unit tests with Vitest (100% coverage target)

---

### Story 3.2: Paystack Transfer Integration (Escrow Collection)

As a **developer**,
I want to integrate Paystack Transfers,
So that escrow funds are collected and held until release.

**Acceptance Criteria:**

**Given** a user is purchasing from an EMERGING merchant
**When** they complete checkout
**Then** The full payment (100%) is collected into the Platform Paystack Balance
**And** The escrow hold is recorded in `escrow_holds` with state HELD
**And** The merchant receives a notification: "Payment received. Funds held in escrow until delivery confirmed."
**And** The transaction is linked to the escrow hold via `transaction_id`
**And** Paystack webhook `/api/webhooks/paystack` updates transaction status on `charge.success`
**And** If payment fails, no escrow record is created

**Prerequisites:** Story 3.1

**Technical Notes:**
- Use Paystack Standard Checkout (Collect to Balance)
- Create Server Action `createEscrowTransaction(dealId, amount, merchantId)`
- Implement webhook handler with signature verification
- Create `transactions` table (user_id, deal_id, amount, status, escrow_hold_id)
- **Pivot Note:** Do NOT use Split Payments. Funds must be held in balance for 7 days.
- Test with Paystack test keys

---

### Story 3.3: Employee Confirmation Workflow

As an **employee**,
I want to confirm delivery of my purchase,
So that the merchant receives their payment.

**Acceptance Criteria:**

**Given** I have an active escrow hold (state: HELD)
**When** I navigate to `/dashboard/employee/transactions/[id]`
**Then** I see a "Confirm Delivery" button
**And** Clicking the button shows a confirmation modal: "Did you receive your order as expected?"
**And** Selecting "Yes" releases the escrow (state: HELD → RELEASED)
**And** The merchant receives payment within 24 hours
**And** I receive a confirmation email: "Thank you! Merchant has been paid."
**And** The transaction shows "Completed" status
**And** If I select "No", I am redirected to the dispute flow (Story 3.4)

**Prerequisites:** Story 3.2

**Technical Notes:**
- Create transaction detail page with escrow status indicator
- Implement Server Action `confirmDelivery(escrowHoldId)`
- Update escrow state and trigger Paystack payout to merchant
- Send confirmation emails to both employee and merchant
- Add "Trust Shield" animation (green checkmark) on successful confirmation
- Test: Confirm delivery → verify state change → verify merchant payout

---

### Story 3.4: Evidence-Based Dispute Resolution

As an **employee**,
I want to dispute a transaction if I didn't receive my order,
So that I can get a refund.

**Acceptance Criteria:**

**Given** I have an active escrow hold
**When** I click "Report Issue" on the transaction page
**Then** I am prompted to upload evidence (photo, description, max 3 files)
**And** The escrow state changes to DISPUTED
**And** The merchant is notified and can respond with counter-evidence
**And** An admin review is triggered (manual resolution required)
**And** I receive an email: "Your dispute has been submitted. We'll review within 3 business days."
**And** The merchant cannot receive payment until the dispute is resolved
**And** If resolved in my favor, the escrow is REFUNDED; if in merchant's favor, it's RELEASED

**Prerequisites:** Story 3.3

**Technical Notes:**
- Create dispute form with file upload (use Vercel Blob or S3)
- Create `disputes` table (escrow_hold_id, employee_evidence, merchant_evidence, resolution, resolved_by)
- Implement Server Action `createDispute(escrowHoldId, evidence)`
- Send notifications to merchant and admin
- Create admin dispute resolution UI (Story 6.x - deferred)
- Add fraud detection: flag users with >15% dispute rate
- Test: Create dispute → verify state change → verify notifications

---

### Story 3.5: Auto-Release Scheduler (14-Day Timer)

As a **system**,
I want to automatically release escrow after 14 days,
So that merchants are paid even if employees forget to confirm.

**Acceptance Criteria:**

**Given** an escrow hold has been in HELD state for 14 days
**When** the daily Inngest cron job runs
**Then** the escrow state changes to RELEASED
**And** The system triggers a Paystack Transfer to the merchant's bank account
**And** The employee receives an email: "Your escrow for [Merchant] has been auto-released. No action needed."
**And** The transaction shows "Auto-Completed" status
**And** Reminder emails are sent on Day 7 and Day 12 (FR11)
**And** A reconciliation job runs to verify `SUM(Escrow HELD) == Paystack Balance`

**Prerequisites:** Story 3.1

**Technical Notes:**
- Create Inngest function `autoReleaseEscrow` in `src/inngest/auto-release.ts`
- Schedule to run daily at 2 AM WAT
- Query `escrow_holds` where `state = 'HELD' AND held_at < NOW() - INTERVAL '14 days'`
- Batch update states and trigger Paystack Transfers (using Idempotency Keys)
- Implement reconciliation logic in separate Inngest function
- Send reminder emails on Day 7 and Day 12 using separate Inngest function
- Add logging for monitoring (how many holds released per day)
- Test: Mock 14-day-old hold → run cron → verify release and transfer call

---


## Epic 4: Tax & Benefits

**Goal:** Deliver tax optimization value to employers and employees through compliance reporting and savings visualization.

**Value Delivered:** Employers can claim 150% tax deductions, and employees can visualize their contribution to employer savings.

---

### Story 4.1: Tax Shield View (Employee Dashboard)

As an **employee**,
I want to see how much I've contributed to my employer's tax savings,
So that I feel valued and understand the platform's impact.

**Acceptance Criteria:**

**Given** I have made purchases using my stipend wallet
**When** I view my employee dashboard
**Then** I see a "Tax Shield" widget showing my cumulative contribution (e.g., "You've helped save ₦45,000 in taxes!")
**And** The widget displays a progress bar or animated counter
**And** A tooltip explains: "Your employer gets 150% tax deduction on stipend spending under Nigeria Tax Act 2025"
**And** The calculation is: (Total Stipend Spent × 1.5 × Employer Tax Rate)
**And** The widget updates in real-time after each transaction
**And** The UI uses Electric Lime (#96E072) for the savings indicator

**Prerequisites:** Story 5.2 (Wallet transactions must exist)

**Technical Notes:**
- Create `TaxShieldWidget` component
- Implement Server Action `calculateEmployeeTaxContribution(userId)`
- Query `transactions` table where `source = 'STIPEND_WALLET'`
- Assume employer tax rate = 30% (or fetch from `organizations` table)
- Use TanStack Query for real-time updates
- Add animation using Framer Motion or CSS transitions
- Test: Make transaction → verify widget updates

---

### Story 4.2: Rent Receipt Generation

As an **employee**,
I want to generate a rent receipt for tax relief,
So that I can claim the new Rent Relief under Nigeria Tax Act 2025.

**Acceptance Criteria:**

**Given** I have paid rent using the platform (or manually entered rent data)
**When** I navigate to `/dashboard/employee/tax/rent-receipt`
**Then** I can enter: landlord name, property address, rent amount, payment date
**And** The system generates a PDF receipt with official formatting
**And** The receipt includes: employee details, landlord details, payment proof, platform stamp
**And** I can download the PDF or email it to myself
**And** The receipt is stored in my account for future access
**And** The PDF is compliant with FIRS (Federal Inland Revenue Service) requirements

**Prerequisites:** Story 1.3

**Technical Notes:**
- Create rent receipt form page
- Use `react-pdf` or `pdfkit` to generate PDF
- Create `rent_receipts` table (user_id, landlord_name, amount, payment_date, pdf_url)
- Store PDFs in Vercel Blob or S3
- Implement Server Action `generateRentReceipt(data)`
- Send email with PDF attachment via Resend
- Add validation: rent amount must be realistic (₦50k - ₦5M)
- Test: Generate receipt → verify PDF format → verify email delivery

---

### Story 4.3: Employer Welfare Spending Report

As an **employer admin**,
I want to generate a monthly welfare spending report,
So that I can claim the 50% additional tax deduction.

**Acceptance Criteria:**

**Given** I have funded employee stipend wallets
**When** I navigate to `/dashboard/employer/tax/reports`
**Then** I can select a date range (e.g., January 2025)
**And** The system generates a report showing: total stipend funded, total employee spending, eligible tax deduction (150% of spending)
**And** The report includes a breakdown by employee (name, amount spent, tax contribution)
**And** I can download the report as PDF or CSV
**And** The report includes a disclaimer: "Consult your tax advisor for filing"
**And** The report is formatted for submission to FIRS

**Prerequisites:** Story 5.2, Story 6.1

**Technical Notes:**
- Create tax reports page for employers
- Implement Server Action `generateWelfareSpendingReport(orgId, startDate, endDate)`
- Query `transactions` and `wallets` tables filtered by organization
- Calculate: Total Spending × 1.5 × 30% (employer tax rate)
- Generate PDF using `react-pdf` with official formatting
- Add CSV export option using `papaparse`
- Include legal disclaimer text
- Test: Fund wallets → generate report → verify calculations

---

### Story 4.4: Tax Savings Calculator (Pre-Sales Tool)

As a **prospective employer**,
I want to calculate potential tax savings,
So that I can decide if the platform is worth adopting.

**Acceptance Criteria:**

**Given** I am on the public marketing site
**When** I visit `/tax-calculator`
**Then** I can enter: number of employees, average stipend per employee per month
**And** The calculator shows: monthly stipend cost, annual tax savings (150% deduction), net cost after tax savings
**And** The calculator updates in real-time as I adjust inputs
**And** I see a comparison: "Without Stipends: ₦X cost | With Stipends: ₦Y cost (₦Z saved)"
**And** A CTA button: "Get Started" links to employer signup
**And** The calculator is mobile-responsive

**Prerequisites:** None (public page)

**Technical Notes:**
- Create public page `/tax-calculator` (outside dashboard)
- Use React state for real-time calculation (no server action needed)
- Formula: Annual Savings = (Employees × Monthly Stipend × 12) × 1.5 × 0.30
- Add input validation (employees: 10-10,000, stipend: ₦5k-₦50k)
- Use Vibrant Coral (#FA7921) for CTA button
- Add social proof: "Join 50+ employers saving millions in taxes"
- Test: Enter values → verify calculations → verify CTA link

---


## Epic 5: Employee Wallet & Stipends

**Goal:** Enable employer-funded spending and wallet management.

**Value Delivered:** Employees can receive and spend employer-funded stipends.

---

### Story 5.1: Wallet Data Model & Balance Tracking

As a **developer**,
I want to create the wallet system,
So that employees can store and spend stipend funds.

**Acceptance Criteria:**

**Given** the database supports wallets
**When** I create the wallet schema
**Then** the `wallets` table exists with fields: user_id, balance, currency (NGN), created_at, updated_at
**And** Each employee has exactly one wallet (1:1 relationship)
**And** The `wallet_transactions` table tracks all movements (DEPOSIT, SPEND, REFUND)
**And** Wallet balance is calculated as SUM(deposits) - SUM(spends)
**And** All transactions are immutable (no updates, only inserts)
**And** Wallet balance cannot go negative (enforced via DB constraint)

**Prerequisites:** Story 1.2

**Technical Notes:**
- Create `wallets` table with unique constraint on `user_id`
- Create `wallet_transactions` table (wallet_id, type, amount, description, created_at)
- Add CHECK constraint: `balance >= 0`
- Implement trigger or application logic to update wallet balance on transaction insert
- Create indexes on `wallet_id` and `created_at` for fast queries
- Test: Create wallet → add transaction → verify balance update

---

### Story 5.2: Stipend Funding (Employer Action)

As an **employer admin**,
I want to fund employee stipend wallets,
So that my employees can spend on the platform.

**Acceptance Criteria:**

**Given** I am logged in as an employer admin
**When** I navigate to `/dashboard/employer/stipends/fund`
**Then** I can select employees (individual or bulk via CSV)
**And** I can enter the funding amount per employee (₦5,000 - ₦50,000)
**And** I see a preview: "Fund 50 employees × ₦10,000 = ₦500,000 total"
**And** I can pay via Paystack (one-time payment)
**And** After payment, all selected employee wallets are credited
**And** Employees receive email notifications: "Your ₦10,000 stipend has arrived!"
**And** The transaction is recorded in `wallet_transactions` with type DEPOSIT

**Prerequisites:** Story 5.1, Story 6.1

**Technical Notes:**
- Create stipend funding page for employers
- Implement bulk selection UI (checkboxes or CSV upload)
- Use Paystack for employer payment
- Implement Server Action `fundStipends(employeeIds, amount)`
- Batch insert into `wallet_transactions`
- Send email notifications via Resend (use batch sending)
- Add validation: amount must be within limits
- Test: Fund wallets → verify balance updates → verify emails

---

### Story 5.3: Wallet Balance Display (Employee Dashboard)

As an **employee**,
I want to see my current wallet balance,
So that I know how much I can spend.

**Acceptance Criteria:**

**Given** I am logged in as an employee
**When** I view my dashboard
**Then** I see a prominent "Wallet" widget showing my balance (e.g., "₦12,500")
**And** The widget shows a trend indicator (e.g., "+12% this month")
**And** I can click the widget to view transaction history
**And** The balance updates in real-time after transactions
**And** The UI uses Electric Royal Blue (#2563EB) for the wallet card
**And** If my balance is low (<₦1,000), I see a prompt: "Ask your employer to top up your stipend"

**Prerequisites:** Story 5.1

**Technical Notes:**
- Create `WalletWidget` component
- Fetch balance using Server Component or TanStack Query
- Calculate trend: compare current month balance to previous month
- Add click handler to navigate to `/dashboard/employee/wallet/history`
- Use TanStack Query for real-time updates (refetch on transaction)
- Add low balance alert logic
- Test: View dashboard → verify balance display → make transaction → verify update

---

### Story 5.4: Stipend Payment at Checkout

As an **employee**,
I want to pay for deals using my stipend wallet,
So that I can use my employer-funded balance.

**Acceptance Criteria:**

**Given** I have a positive wallet balance
**When** I checkout a deal
**Then** I see payment options: "Pay with Stipend Wallet" or "Pay with Card"
**And** If I select "Stipend Wallet" and have sufficient balance, the payment succeeds instantly
**And** My wallet balance is debited
**And** The transaction is recorded in `wallet_transactions` with type SPEND
**And** If my balance is insufficient, I see: "Insufficient balance. Top up needed: ₦X"
**And** I can split payment (partial wallet + partial card) if enabled

**Prerequisites:** Story 5.3, Story 2.2

**Technical Notes:**
- Add wallet payment option to checkout flow
- Implement Server Action `payWithWallet(dealId, amount)`
- Check wallet balance before processing
- Insert SPEND transaction and update balance atomically (use DB transaction)
- Handle insufficient balance gracefully
- Add split payment logic (optional, can defer)
- Test: Pay with wallet → verify balance deduction → verify transaction record

---


## Epic 6: Employer Admin

**Goal:** Empower employers to manage workforce and view analytics.

**Value Delivered:** Employers can onboard employees, view usage metrics, and manage their organization.

---

### Story 6.1: Employee Roster Management (CSV Upload)

As an **employer admin**,
I want to upload my employee roster via CSV,
So that I can onboard my workforce quickly.

**Acceptance Criteria:**

**Given** I am logged in as an employer admin
**When** I navigate to `/dashboard/employer/employees/import`
**Then** I can download a CSV template (columns: name, email, department)
**And** I can upload a filled CSV file (max 1,000 rows)
**And** The system validates each row (email format, no duplicates)
**And** I see a preview of employees to be added
**And** Clicking "Confirm Import" creates user accounts and sends invitation emails
**And** Each employee receives a unique invitation code
**And** The import status is tracked (pending, completed, failed)
**And** I can view import history and re-download failed rows

**Prerequisites:** Story 1.4

**Technical Notes:**
- Create CSV import page
- Use `papaparse` to parse CSV
- Implement Server Action `importEmployees(csvData)`
- Validate emails using Zod
- Generate unique invitation codes (8-character alphanumeric)
- Batch insert into `invitations` table
- Send emails via Resend (batch sending, max 100 per batch)
- Create `import_jobs` table to track status
- Test: Upload CSV → verify validation → verify invitations sent

---

### Story 6.2: Usage Analytics Dashboard

As an **employer admin**,
I want to view employee engagement metrics,
So that I can measure platform ROI.

**Acceptance Criteria:**

**Given** I am logged in as an employer admin
**When** I navigate to `/dashboard/employer/analytics`
**Then** I see key metrics: total employees, active users (last 30 days), activation rate (%), total savings generated
**And** I see a chart showing monthly active users over time
**And** I see a breakdown by department (if departments are tracked)
**And** I can filter by date range (last 7 days, 30 days, 90 days, custom)
**And** I see top deals redeemed by my employees
**And** The dashboard loads in under 3 seconds

**Prerequisites:** Story 6.1, Story 2.2

**Technical Notes:**
- Create analytics dashboard page
- Implement Server Action `getEmployerAnalytics(orgId, dateRange)`
- Query `transactions` and `users` tables aggregated by organization
- Calculate activation rate: (Active Users / Total Employees) × 100
- Use Chart.js or Recharts for visualizations
- Add date range picker component
- Cache analytics data (refresh every 1 hour)
- Test: View dashboard → verify metrics → change date range → verify update

---

### Story 6.3: Communication Templates

As an **employer admin**,
I want to download ready-made communication templates,
So that I can promote the platform internally.

**Acceptance Criteria:**

**Given** I am logged in as an employer admin
**When** I navigate to `/dashboard/employer/resources`
**Then** I see downloadable templates: launch email, Slack announcement, poster PDF
**And** Each template is pre-filled with my company name and platform details
**And** I can customize the text before downloading
**And** The email template includes a CTA link with my company's invitation code
**And** The poster PDF is print-ready (A4 size, high-resolution)
**And** I can preview templates before downloading

**Prerequisites:** Story 6.1

**Technical Notes:**
- Create resources page with template gallery
- Use React Email for email templates
- Use `react-pdf` for poster generation
- Implement Server Action `generateTemplate(type, customizations)`
- Pre-fill templates with organization data from `organizations` table
- Add customization form (company name, logo, custom message)
- Generate downloadable files (HTML for email, PDF for poster)
- Test: Generate templates → verify customization → verify downloads

---

### Story 6.4: Employer Profile & Settings

As an **employer admin**,
I want to manage my organization's profile,
So that I can update company details and preferences.

**Acceptance Criteria:**

**Given** I am logged in as an employer admin
**When** I navigate to `/dashboard/employer/settings`
**Then** I can update: company name, logo, industry, employee count
**And** I can configure SSO settings (Google Workspace, Microsoft 365)
**And** I can set default stipend amount for new employees
**And** I can enable/disable features (e.g., rent receipt generation)
**And** Changes are saved and reflected across the platform
**And** I receive a confirmation email after updating critical settings

**Prerequisites:** Story 1.2

**Technical Notes:**
- Create employer settings page
- Implement Server Action `updateOrganization(orgId, updates)`
- Add file upload for company logo (use Vercel Blob)
- Integrate Clerk's Organization Settings API for SSO configuration
- Add validation: employee count must be realistic (10-100,000)
- Send confirmation email for security-sensitive changes
- Test: Update settings → verify changes persist → verify email

---

### Story 6.5: Admin Dispute Resolution Portal (Deferred from Epic 3)

As an **internal admin**,
I want to review and resolve disputes,
So that I can adjudicate between employees and merchants.

**Acceptance Criteria:**

**Given** I am logged in as a system admin
**When** I navigate to `/admin/disputes`
**Then** I see a list of active disputes (status: DISPUTED)
**And** I can view evidence from both Employee and Merchant
**And** I can make a ruling: "Refund Employee" or "Release to Merchant"
**And** The ruling updates the escrow state (REFUNDED or RELEASED)
**And** The ruling triggers the appropriate money movement (Paystack refund or transfer)
**And** Both parties receive an email notification of the decision
**And** I can add internal notes to the dispute record

**Prerequisites:** Story 3.4

**Technical Notes:**
- Create admin dashboard layout (separate from Employer dashboard)
- Implement Server Action `resolveDispute(disputeId, decision, notes)`
- Use `db.transaction()` to ensure state update and money movement are atomic
- Add RBAC (Role-Based Access Control) to ensure only authorized admins can access
- Test: Simulate dispute → resolve as admin → verify funds moved

---

### Story 6.6: Merchant Dispute Response UI (Deferred from Epic 3)

As a **merchant**,
I want to respond to a dispute with my own evidence,
So that I can prove I delivered the service.

**Acceptance Criteria:**

**Given** a transaction has been disputed by an employee
**When** I receive the dispute notification email
**Then** I can click a link to view the dispute details (no login required, use secure token)
**And** I can see the employee's claim and evidence
**And** I can upload my own evidence (delivery receipt, photos)
**And** I can submit a text explanation
**And** The dispute status updates to "Evidence Submitted"
**And** The admin is notified that merchant evidence is ready

**Prerequisites:** Story 3.4

**Technical Notes:**
- Create public-facing dispute response page `/disputes/respond/[token]`
- Generate secure, time-limited tokens for merchant access
- Allow file upload (limit 3 files, 5MB each)
- Implement Server Action `submitMerchantEvidence(token, evidence)`
- Test: Click email link → upload evidence → verify admin sees it

---

## FR Coverage Matrix

| FR | Description | Epic | Stories |
| :--- | :--- | :--- | :--- |
| **FR1** | Employee SSO/Invitation Registration | Epic 1 | 1.3, 1.4 |
| **FR2** | Account Portability | Epic 1 | 1.5 |
| **FR3** | Tax Shield View | Epic 4 | 4.1 |
| **FR4** | Merchant Directory with Badges | Epic 2 | 2.2 |
| **FR5** | Auto-apply Escrow to Emerging Brands | Epic 3 | 3.2 |
| **FR6** | Employee Confirmation Workflow | Epic 3 | 3.3 |
| **FR7** | Evidence-Based Dispute Resolution | Epic 3 | 3.4 |
| **FR8** | Auto-Release After 14 Days | Epic 3 | 3.5 |
| **FR9** | Deal Browsing with Category Filters | Epic 2 | 2.3 |
| **FR10** | Search with Location Recommendations | Epic 2 | 2.4 |
| **FR11** | Notification Reminders (Day 7, 12) | Epic 3 | 3.5 |
| **FR12** | Employee Roster Management | Epic 6 | 6.1 |
| **FR13** | Stipend Wallet Funding | Epic 5 | 5.2 |
| **FR14** | Rent Receipt Generation | Epic 4 | 4.2 |
| **FR15** | Employer Welfare Spending Report | Epic 4 | 4.3 |

---

## Summary

**Total Epics:** 6
**Total Stories:** 25

**Epic Breakdown:**
- **Epic 1 (Foundation):** 5 stories
- **Epic 2 (Marketplace):** 5 stories
- **Epic 3 (Escrow):** 5 stories
- **Epic 4 (Tax & Benefits):** 4 stories
- **Epic 5 (Wallet):** 4 stories
- **Epic 6 (Employer Admin):** 6 stories

**FR Coverage:** All 15 Functional Requirements are covered by at least one story.

**Context Incorporated:**
- ✅ PRD requirements (all FRs mapped)
- ✅ UX Design patterns (color palette, typography, Trust Shield animations)
- ✅ Architecture decisions (Next.js, Clerk, Neon, Paystack, Inngest)

**Next Steps:**
- Run Implementation Readiness workflow to validate technical feasibility
- Begin Sprint Planning (Phase 4 Implementation)

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document will be updated if new requirements emerge or architectural decisions change._

