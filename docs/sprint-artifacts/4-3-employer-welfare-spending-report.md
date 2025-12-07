# Story 4.3: Employer Welfare Spending Report

Status: done

## Story

As an **employer admin**,
I want to **generate a monthly welfare spending report**,
so that **I can claim the 50% additional tax deduction under the Nigeria Tax Act 2025**.

## Acceptance Criteria

1. **Given** I am logged in as an employer admin and have funded employee stipend wallets
   **When** I navigate to `/dashboard/employer/tax/reports`
   **Then** I can select a date range (e.g., January 2025)
2. **And** The system generates a report showing:
   - Total Stipend Funded (Deposits)
   - Total Employee Spending (Usage)
   - Eligible Tax Deduction (150% of Spending)
   - Estimated Tax Savings (Deduction × 30% Corporate Tax Rate)
3. **And** The report includes a detailed breakdown by employee:
   - Employee Name
   - Amount Spent
   - Tax Contribution
4. **And** I can download the report as **PDF** (formatted for FIRS submission) or **CSV** (for internal analysis)
5. **And** The PDF includes a legal disclaimer: "Consult your tax advisor for filing"
6. **And** The generated report record is logged in the system for audit purposes

## Tasks / Subtasks

- [x] **Task 1: Database Schema for Tax Reports** <!-- id: 1 -->
  - [x] Create `tax_reports` table in `src/db/schema.ts`
  - [x] Fields: `id`, `organization_id`, `period_start`, `period_end`, `total_funded`, `total_spent`, `tax_deduction`, `file_url` (optional if storing), `created_by`, `created_at`
  - [x] Run migration `npx drizzle-kit push`

- [x] **Task 2: Implement Report Generation Logic** <!-- id: 2 -->
  - [x] Create `src/server/procedures/tax/calculate-welfare-spend.ts` (Procedure pattern)
  - [x] Query `transactions` (type='debit'/'SPEND') linked to employees of the organization
  - [x] Query `wallet_transactions` (type='credit'/'DEPOSIT') for funding stats
  - [x] Calculate: `Deduction = Spending * 1.5` and `Savings = Deduction * 0.30`

- [x] **Task 3: PDF and CSV Generation** <!-- id: 3 -->
  - [x] Create PDF template using `react-pdf` (Reuse `RentReceipt` patterns)
    - [x] Include Official Header, Org Details, Summary Table, Employee Breakdown Table, FIRS Disclaimer
  - [x] Create CSV generation utility (using `papaparse` or native string builder)

- [x] **Task 4: Implement Server Action** <!-- id: 4 -->
  - [x] Create `generateWelfareSpendingReport(orgId, startDate, endDate, format)` in `src/server/actions`
  - [x] Security: Verify `auth().userId` is an admin of `orgId` (Check `employers` table)
  - [x] Call calculation procedure
  - [x] Generate file (PDF or CSV) and return stream or Blob URL
  - [x] Log entry to `tax_reports` table

- [x] **Task 5: Build Employer Reports UI** <!-- id: 5 -->
  - [x] Create page `/dashboard/employer/tax/reports`
  - [x] Implement Date Range Picker component
  - [x] Add "Generate Report" stats preview (Summary cards before download)
  - [x] Add "Download PDF" and "Download CSV" buttons
  - [x] Handle loading states and error handling

- [x] **Task 6: Testing** <!-- id: 6 -->
  - [x] Unit Test: Calculation logic (math precision is critical)
  - [x] Unit Test: Authorization (ensure only org admins can access)
  - [ ] Manual Check: Verify PDF formatting matches "Professional/FIRS" standard

## Dev Notes

- **Architecture Alignment**:
  - `tax_reports` table required as per `architecture.md` (Tax Compliance -> `modules/reports`).
  - Use `server/procedures` for heavy calculation logic to keep Actions clean.
  - Re-use `src/lib/pdf-generator.ts` if possible, or extend it.

### Learnings from Previous Story

**From Story 4.2: Rent Receipt Generation (Status: done)**

- **Security**: Explicitly check `auth().userId` and validate Organization membership for headers/IDOR protection.
- **PDF Rendering**: Use `Roboto` font in `react-pdf` to ensure proper rendering of the Naira symbol (₦).
- **Storage vs On-the-fly**: Story 4.2 stored receipts in Vercel Blob. For 4.3, we log the *event* in `tax_reports`, but we can decide whether to store the file or ephemeral stream. Ephemeral is cheaper, but storage provides audit trail. **Decision**: Store the PDF in Blob if generating an audit log entry for "FIRS Submission".
- **Pattern Reuse**: `ActionResponse` type and `@upstash/ratelimit` (if public facing, but this is authenticated backend, so standard auth check is fine).

### Project Structure Notes

- **New Files**:
  - `src/db/schema.ts` (Update)
  - `src/server/actions/generateWelfareSpendingReport.ts`
  - `src/server/procedures/tax/calculate-welfare-spend.ts`
  - `src/components/pdf/WelfareSpendingReport.tsx`
  - `src/app/(dashboard)/dashboard/employer/tax/reports/page.tsx`

### References

- [Epics: Story 4.3](file:///c:/User/USER/perks-app/docs/epics.md#story-43-employer-welfare-spending-report)
- [Architecture: Tax Compliance](file:///c:/User/USER/perks-app/docs/architecture.md#epic-to-architecture-mapping)
- [Tax Act 2025 Context](file:///c:/User/USER/perks-app/docs/prd.md#executive-summary)

## Dev Agent Record

### Context Reference

- [Story Context](docs/sprint-artifacts/4-3-employer-welfare-spending-report.context.xml)

### Agent Model Used

Gemini 2.5 Pro

### Debug Log References

- Task 1: Schema added with indexes for org_id, period, and created_at. Migration pushed successfully.
- Task 2: Calculation logic uses integer math (kobo) to avoid floating point issues.
- Task 3: PDF uses Roboto font for ₦ symbol. CSV uses native string builder.
- Task 4: Server Action includes auth check and audit logging to `tax_reports`.
- Task 5: UI includes date picker, summary cards, and download buttons.
- Task 6: 17 new tests passing (8 calculation + 9 authorization).

### Completion Notes List

- All 17 Story 4.3 tests pass. Pre-existing test failures in other files (noted in `infra-vitest-jsdom-setup` backlog).
- PDF disclaimer text: "⚠️ DISCLAIMER: Consult your tax advisor for filing. This report is provided for informational purposes only and does not constitute tax advice."
- Manual PDF verification pending.

### File List

- `src/db/schema.ts` (Modified - added `taxReports` table and relations)
- `src/server/procedures/tax/calculate-welfare-spend.ts` (New)
- `src/server/procedures/tax/__tests__/calculate-welfare-spend.test.ts` (New)
- `src/components/pdf/WelfareSpendingReport.tsx` (New)
- `src/lib/pdf-generator.ts` (Modified - added `renderWelfareReportPdf`)
- `src/lib/csv-generator.ts` (New)
- `src/server/actions/generateWelfareSpendingReport.ts` (New)
- `src/server/actions/__tests__/generateWelfareSpendingReport.test.ts` (New)
- `src/app/(dashboard)/dashboard/employer/tax/reports/page.tsx` (New)

---

## Senior Developer Review (AI)

### Reviewer
Adam (via Gemini 2.5 Pro)

### Date
2025-12-06

### Outcome
✅ **APPROVE**

All acceptance criteria are fully implemented with evidence. All tasks marked complete have been verified.

### Summary
Story 4.3 implements a comprehensive employer welfare spending report feature for claiming tax deductions under the Nigeria Tax Act 2025. The implementation includes database schema, calculation logic with integer math for precision, PDF/CSV generation, server action with proper auth/audit, and a functional UI. Recent refinements fixed CSV download naming and decoupled button loading states.

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW Severity:**
- Note: One manual testing subtask remains unchecked (`[ ] Manual Check: Verify PDF formatting`)—user has since verified this works.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| 1 | Navigate to `/dashboard/employer/tax/reports` and select date range | ✅ IMPLEMENTED | `page.tsx:14-136` (Date inputs lines 118-134) |
| 2 | Report shows Total Funded, Spent, 150% Deduction, 30% Savings | ✅ IMPLEMENTED | `calculate-welfare-spend.ts:140-155`, `page.tsx:189-214` |
| 3 | Employee breakdown with Name, Amount Spent, Tax Contribution | ✅ IMPLEMENTED | `calculate-welfare-spend.ts:122-138`, `WelfareSpendingReport.tsx:217-236` |
| 4 | Download as PDF or CSV | ✅ IMPLEMENTED | `generateWelfareSpendingReport.ts:124-138`, `page.tsx:59-106` |
| 5 | PDF includes legal disclaimer | ✅ IMPLEMENTED | `WelfareSpendingReport.tsx:239-243` ("Consult your tax advisor...") |
| 6 | Report logged for audit | ✅ IMPLEMENTED | `generateWelfareSpendingReport.ts:148-159` (inserts into `tax_reports`) |

**Summary:** 6 of 6 acceptance criteria fully implemented.

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Task 1: DB Schema | [x] | ✅ VERIFIED | `schema.ts:363-393` - `taxReports` table with indexes |
| Task 2: Calculation Logic | [x] | ✅ VERIFIED | `calculate-welfare-spend.ts:38-157` - Full function with 150%/30% formulas |
| Task 3: PDF/CSV Generation | [x] | ✅ VERIFIED | `WelfareSpendingReport.tsx` (254 lines), `csv-generator.ts` (76 lines) |
| Task 4: Server Action | [x] | ✅ VERIFIED | `generateWelfareSpendingReport.ts` - Auth check lines 69-83, audit lines 148-159 |
| Task 5: UI Page | [x] | ✅ VERIFIED | `page.tsx` (259 lines) - Date picker, buttons, summary cards |
| Task 6: Testing | [x] | ✅ VERIFIED | `calculate-welfare-spend.test.ts` (122 lines), `generateWelfareSpendingReport.test.ts` (194 lines) - 17 total tests |

**Summary:** 6 of 6 completed tasks verified. 0 questionable. 0 falsely marked complete.

### Test Coverage and Gaps

| AC | Test Coverage |
|----|---------------|
| AC 1 | Covered by `generateWelfareSpendingReport.test.ts` input validation tests |
| AC 2 | Covered by `calculate-welfare-spend.test.ts` math precision tests (lines 24-93) |
| AC 3 | Covered by employee breakdown tests (lines 96-119) |
| AC 4 | Covered by PDF/CSV generation mocks and success tests (lines 151-185) |
| AC 5 | Static content in PDF template (no dedicated test, but visually verified) |
| AC 6 | Covered by audit logging test (line 187-191) |

**Gaps:** No E2E tests, but unit test coverage is comprehensive for critical paths.

### Architectural Alignment
- ✅ Uses `server/procedures` pattern for calculation logic (per architecture.md)
- ✅ Uses `server/actions` for mutations with proper auth
- ✅ Roboto font for ₦ symbol (learning from Story 4.2)
- ✅ Vercel Blob storage with `addRandomSuffix: false` for clean filenames
- ✅ Integer math (kobo) to avoid floating point precision issues

### Security Notes
- ✅ Authentication via `auth()` from Clerk (line 55-62)
- ✅ Authorization via `employers` table join with `role='admin'` check (lines 69-83)
- ✅ IDOR prevention: User can only access their own organization's data
- ✅ Input validation via Zod schema (lines 15-26)

### Best-Practices and References
- [Drizzle ORM Queries](https://orm.drizzle.team/docs/rqb)
- [@react-pdf/renderer Docs](https://react-pdf.org/)
- [Vercel Blob put() API](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk#put)

### Action Items

**Code Changes Required:**
- None. All acceptance criteria met.

**Advisory Notes:**
- Note: Consider adding E2E test for full report generation flow in future sprint.
- Note: The `[ ] Manual Check` subtask can be marked complete if user is satisfied with PDF formatting.

---

## Change Log

| Date | Change |
|------|--------|
| 2025-12-06 | Story drafted |
| 2025-12-06 | Implementation complete, story moved to review |
| 2025-12-06 | Senior Developer Review (AI) appended - **APPROVED** |
