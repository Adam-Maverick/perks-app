# Implementation Plan - Story 3.4: Evidence-Based Dispute Resolution

## Goal Description
Implement the evidence-based dispute resolution workflow, allowing employees to dispute transactions when orders are not received. This includes file evidence upload, dispute tracking, and resolution logic (refunds vs. releases).

## User Review Required
> [!IMPORTANT]
> **Deferred Portals**: The Merchant and Admin portals for dispute resolution are deferred to Epic 6. Placeholder pages will be created for now. Resolution logic will be implemented but primarily tested via scripts/tests until the UI is built.

> [!WARNING]
> **Paystack Refunds**: Refunds take 1-7 business days. This expectation is managed in the UI/Email, but be aware of the delay during testing.

## Proposed Changes

### Database
#### [MODIFY] [schema.ts](file:///c:/User/USER/perks-app/src/db/schema.ts)
- Add `disputes` table definition.
- Add `is_flagged` boolean to `users` table for fraud detection.

### Dependencies
- Install `@vercel/blob` for file storage.

### Components
#### [NEW] [DisputeForm.tsx](file:///c:/User/USER/perks-app/src/components/modules/disputes/DisputeForm.tsx)
- Form for submitting disputes with description and file upload.

#### [NEW] [FileUpload.tsx](file:///c:/User/USER/perks-app/src/components/modules/disputes/FileUpload.tsx)
- Drag-and-drop file upload component using Vercel Blob.

#### [NEW] [DisputeStatusBadge.tsx](file:///c:/User/USER/perks-app/src/components/modules/disputes/DisputeStatusBadge.tsx)
- Visual indicator for dispute status (PENDING, UNDER_REVIEW, RESOLVED).

#### [NEW] [Emails](file:///c:/User/USER/perks-app/src/components/emails/)
- `employee-dispute-submitted.tsx`
- `merchant-dispute-notification.tsx`
- `admin-dispute-notification.tsx`

### Pages
#### [NEW] [Employee Dispute Page](file:///c:/User/USER/perks-app/src/app/(dashboard)/employee/transactions/[id]/dispute/page.tsx)
- The main entry point for creating a dispute.

#### [NEW] [Placeholders](file:///c:/User/USER/perks-app/src/app/(dashboard)/)
- `merchant/disputes/[id]/page.tsx`
- `admin/disputes/[id]/page.tsx`

#### [MODIFY] [Transaction Detail](file:///c:/User/USER/perks-app/src/app/(dashboard)/employee/transactions/[id]/page.tsx)
- Add "Report Issue" button.
- Add Dispute Status section.

### Server Actions & Logic
#### [NEW] [disputes.ts](file:///c:/User/USER/perks-app/src/server/actions/disputes.ts)
- `createDispute`: Handles creation, state transition, and notifications.
- `resolveDispute`: Handles resolution logic (refund/release).
- `uploadDisputeEvidence`: Handles file upload to Vercel Blob.

#### [MODIFY] [payments.ts](file:///c:/User/USER/perks-app/src/server/actions/payments.ts)
- Add `refundTransaction` function wrapping Paystack Refund API.

#### [MODIFY] [notifications.ts](file:///c:/User/USER/perks-app/src/server/actions/notifications.ts)
- Add `sendDisputeNotifications` function.

#### [NEW] [blob-storage.ts](file:///c:/User/USER/perks-app/src/lib/blob-storage.ts)
- Utility for Vercel Blob operations.

#### [NEW] [fraud-detection.ts](file:///c:/User/USER/perks-app/src/lib/fraud-detection.ts)
- Logic to calculate dispute rates and flag users.

## Verification Plan

### Automated Tests
- Run `npm test` to execute Vitest suite.
- **New Tests**:
    - `src/server/actions/__tests__/disputes.test.ts`: Test dispute creation, state transitions, and resolution logic.
    - `src/lib/__tests__/fraud-detection.test.ts`: Test dispute rate calculation.

### Manual Verification
1.  **Create Dispute**:
    - Navigate to a "HELD" transaction.
    - Click "Report Issue".
    - Upload a dummy file and submit description.
    - Verify redirection and status update to "Under Review".
2.  **Database Check**:
    - Verify `disputes` table has new record.
    - Verify `escrow_holds` state is `DISPUTED`.
3.  **Resolution (Simulated)**:
    - Since Admin UI is placeholder, use a temporary test script or direct DB update to simulate resolution if needed, or rely on unit tests for the logic.
