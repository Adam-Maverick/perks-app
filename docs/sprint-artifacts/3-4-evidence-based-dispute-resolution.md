# Story 3.4: Evidence-Based Dispute Resolution

Status: drafted

## Story

As an **employee**,
I want to dispute a transaction if I didn't receive my order,
so that I can get a refund.

## Acceptance Criteria

1. **Given** I have an active escrow hold
   **When** I click "Report Issue" on the transaction page
   **Then** I am prompted to upload evidence (photo, description, max 3 files)
2. **And** The escrow state changes to DISPUTED
3. **And** The merchant is notified and can respond with counter-evidence
4. **And** An admin review is triggered (manual resolution required)
5. **And** I receive an email: "Your dispute has been submitted. We'll review within 3 business days."
6. **And** The merchant cannot receive payment until the dispute is resolved
7. **And** If resolved in my favor, the escrow is REFUNDED; if in merchant's favor, it's RELEASED

## Tasks / Subtasks

- [ ] Create Disputes Database Schema (AC: 2, 6, 7)
  - [ ] Define `disputes` table in `src/db/schema.ts`
    - Fields: id, escrow_hold_id, employee_evidence_urls, employee_description, merchant_evidence_urls, merchant_response, status (enum), resolution, resolved_by, resolved_at, created_at, updated_at
    - Status enum: PENDING, UNDER_REVIEW, RESOLVED_EMPLOYEE_FAVOR, RESOLVED_MERCHANT_FAVOR
    - Foreign keys: escrow_hold_id → escrow_holds.id, resolved_by → users.id
    - Indexes: status, escrow_hold_id, created_at
  - [ ] Run `npx drizzle-kit push` to create table
  - [ ] Test: Verify table exists in Drizzle Studio

- [ ] Implement File Upload Infrastructure (AC: 1)
  - [ ] Set up Vercel Blob storage for evidence files
    - Install: `npm install @vercel/blob`
    - Configure Vercel Blob token in environment variables
    - Create upload utility in `src/lib/blob-storage.ts`
  - [ ] Create Server Action `uploadDisputeEvidence(file: File)` in `src/server/actions/disputes.ts`
    - Validate file type (images: jpg, png, pdf only)
    - Validate file size (max 5MB per file)
    - Upload to Vercel Blob with unique filename
    - Return blob URL for storage in database
  - [ ] Test: Upload file → verify stored in Vercel Blob → verify URL returned

- [ ] Create Dispute Form UI (AC: 1)
  - [ ] Create page at `(dashboard)/employee/transactions/[id]/dispute/page.tsx`
  - [ ] Display transaction details (merchant, amount, date)
  - [ ] Add file upload component (drag-and-drop or click to upload)
    - Support multiple files (max 3)
    - Show upload progress
    - Preview uploaded images
    - Allow removal of uploaded files
  - [ ] Add description textarea (max 500 characters)
    - Placeholder: "Please describe what happened..."
    - Character counter
    - Required field validation
  - [ ] Add "Submit Dispute" button (disabled until description provided)
  - [ ] Add "Cancel" button (redirect back to transaction page)
  - [ ] Test: Navigate to dispute page → verify form displayed → verify file upload works

- [ ] Implement Dispute Creation Server Action (AC: 1, 2)
  - [ ] Create Server Action `createDispute(escrowHoldId, description, evidenceUrls)` in `src/server/actions/disputes.ts`
  - [ ] Validate user owns the transaction (authorization check)
  - [ ] Validate escrow hold exists and is in HELD state (cannot dispute already released/refunded)
  - [ ] Use `transitionState()` to change HELD → DISPUTED
  - [ ] Create dispute record in `disputes` table
    - Store employee evidence URLs
    - Store employee description
    - Set status to PENDING
  - [ ] Update transaction status to DISPUTED
  - [ ] Use database transaction for atomicity
  - [ ] Return success response with dispute ID
  - [ ] Test: Create dispute → verify state transition → verify dispute record created

- [ ] Implement Dispute Notification Emails (AC: 3, 5)
  - [ ] Create email template `employee-dispute-submitted.tsx` in `src/components/emails`
    - Subject: "Your dispute has been submitted"
    - Content: "We'll review within 3 business days"
    - Include dispute ID and transaction details
    - Add CTA: "View Dispute Status"
  - [ ] Create email template `merchant-dispute-notification.tsx` in `src/components/emails`
    - Subject: "Dispute filed for transaction [ID]"
    - Content: "Employee has reported an issue. Please respond with evidence."
    - Include employee's description (not evidence URLs for privacy)
    - Add CTA: "Respond to Dispute"
  - [ ] Create email template `admin-dispute-notification.tsx` in `src/components/emails`
    - Subject: "New dispute requires review"
    - Content: "Dispute ID [ID] needs manual resolution"
    - Include transaction details and employee description
    - Add CTA: "Review Dispute"
  - [ ] Implement `sendDisputeNotifications(disputeId)` in `src/server/actions/notifications.ts`
    - Send to employee, merchant, and admin
    - Use Resend batch sending for efficiency
  - [ ] Call from `createDispute` Server Action after successful creation
  - [ ] Test: Create dispute → verify all three emails sent

- [ ] Implement Merchant Response UI (AC: 3)
  - [ ] Create page at `(dashboard)/merchant/disputes/[id]/page.tsx` (merchant portal - deferred to Epic 6)
  - [ ] Display dispute details (employee description, evidence)
  - [ ] Add file upload for merchant counter-evidence (max 3 files)
  - [ ] Add response textarea (max 500 characters)
  - [ ] Add "Submit Response" button
  - [ ] **Note:** Merchant portal is out of scope for Epic 3. Create placeholder page with "Coming Soon" message.
  - [ ] Test: Navigate to merchant dispute page → verify placeholder displayed

- [ ] Implement Admin Dispute Resolution UI (AC: 4, 7)
  - [ ] Create page at `(dashboard)/admin/disputes/[id]/page.tsx` (admin portal - deferred to Epic 6)
  - [ ] Display full dispute details (employee + merchant evidence)
  - [ ] Add resolution form with two options:
    - "Resolve in Employee's Favor" (trigger REFUND)
    - "Resolve in Merchant's Favor" (trigger RELEASE)
  - [ ] Add resolution notes textarea (required)
  - [ ] Add "Resolve Dispute" button
  - [ ] **Note:** Admin portal is out of scope for Epic 3. Create placeholder page with "Coming Soon" message.
  - [ ] Test: Navigate to admin dispute page → verify placeholder displayed

- [ ] Implement Dispute Resolution Logic (AC: 7)
  - [ ] Create Server Action `resolveDispute(disputeId, resolution, notes)` in `src/server/actions/disputes.ts`
  - [ ] Validate user is admin (authorization check)
  - [ ] Validate dispute exists and is in PENDING or UNDER_REVIEW status
  - [ ] Update dispute record with resolution and notes
  - [ ] If resolution is EMPLOYEE_FAVOR:
    - Use `transitionState()` to change DISPUTED → REFUNDED
    - Trigger Paystack Refund to employee (create `refundTransaction` in `src/server/actions/payments.ts`)
    - Update transaction status to REFUNDED
  - [ ] If resolution is MERCHANT_FAVOR:
    - Use `transitionState()` to change DISPUTED → RELEASED
    - Trigger Paystack Transfer to merchant (reuse `releaseFundsToMerchant` from Story 3.3)
    - Update transaction status to SUCCESS
  - [ ] Send resolution emails to employee and merchant
  - [ ] Use database transaction for atomicity
  - [ ] Test: Resolve dispute → verify state transition → verify refund/transfer initiated

- [ ] Implement Paystack Refund Function (AC: 7)
  - [ ] Create `refundTransaction(transactionId, amount)` in `src/server/actions/payments.ts`
  - [ ] Fetch transaction's `paystack_reference` from database
  - [ ] Call Paystack `POST /refund` endpoint
    - Set `transaction` to paystack_reference
    - Set `amount` to refund amount (in kobo)
    - Set `merchant_note` to "Dispute resolved in employee's favor"
  - [ ] Log refund request and response for audit trail
  - [ ] Handle errors: network failures, insufficient balance, invalid reference
  - [ ] Test: Call function → verify Paystack API called → verify refund logged

- [ ] Add Fraud Detection (AC: 1-7)
  - [ ] Create utility function `calculateDisputeRate(userId)` in `src/lib/fraud-detection.ts`
  - [ ] Query user's total transactions and total disputes
  - [ ] Calculate dispute rate: (disputes / transactions) × 100
  - [ ] If dispute rate > 15%, flag user account
    - Add `is_flagged` field to `users` table
    - Send admin notification email
    - Add warning banner on user's transaction page
  - [ ] Call from `createDispute` Server Action after dispute creation
  - [ ] Test: Create multiple disputes → verify dispute rate calculated → verify flagging works

- [ ] Update Transaction Detail Page (AC: 1, 6)
  - [ ] Add "Report Issue" button to transaction detail page (visible only when escrow is HELD)
  - [ ] Button redirects to `/dashboard/employee/transactions/[id]/dispute`
  - [ ] Update escrow status badge to show "Under Review" for DISPUTED state
  - [ ] Add dispute status section (if dispute exists)
    - Show dispute ID
    - Show status (PENDING, UNDER_REVIEW, RESOLVED)
    - Show resolution (if resolved)
    - Add "View Dispute Details" link
  - [ ] Disable "Confirm Delivery" button if dispute exists
  - [ ] Test: Create dispute → verify status updated → verify button disabled

- [ ] Add Authorization and Validation (AC: 1-7)
  - [ ] Verify user is authenticated (Clerk middleware)
  - [ ] Verify user owns the transaction (userId matches transaction.userId)
  - [ ] Verify escrow hold exists and is in HELD state (cannot dispute released/refunded)
  - [ ] Prevent duplicate disputes (check if dispute already exists for escrow hold)
  - [ ] Validate file uploads (type, size, count)
  - [ ] Validate description (required, max 500 characters)
  - [ ] Add rate limiting (max 3 disputes per hour per user)
  - [ ] Validate all inputs with Zod schemas
  - [ ] Test: Attempt unauthorized access → verify rejection → verify error handling

- [ ] Write Unit Tests (AC: 1-7)
  - [ ] Create `src/server/actions/__tests__/disputes.test.ts`
  - [ ] Test `createDispute` with valid escrow hold (HELD → DISPUTED)
  - [ ] Test `createDispute` with invalid state (already RELEASED - should fail)
  - [ ] Test `createDispute` with unauthorized user (should fail)
  - [ ] Test `createDispute` with duplicate dispute (should fail)
  - [ ] Test `resolveDispute` with EMPLOYEE_FAVOR (should trigger refund)
  - [ ] Test `resolveDispute` with MERCHANT_FAVOR (should trigger transfer)
  - [ ] Test `uploadDisputeEvidence` with valid file
  - [ ] Test `uploadDisputeEvidence` with invalid file type (should fail)
  - [ ] Test `uploadDisputeEvidence` with oversized file (should fail)
  - [ ] Test `calculateDisputeRate` with various scenarios
  - [ ] Mock Paystack API calls and Vercel Blob uploads
  - [ ] Run: `npm test`

- [ ] Integration Testing (AC: 1-7)
  - [ ] Create test script to simulate full dispute flow
  - [ ] Test: Create escrow hold → create dispute → verify state change → verify emails → resolve dispute → verify refund/transfer
  - [ ] Test: Attempt to dispute already-released escrow → verify error
  - [ ] Test: Create multiple disputes for same user → verify fraud detection
  - [ ] Verify all acceptance criteria met
  - [ ] Run: `npm test` (all tests passing)

## Dev Notes

### Learnings from Previous Story

**From Story 3-3-employee-confirmation-workflow (Status: done)**

- **Escrow State Machine Available**: Use `transitionState()` from `src/lib/escrow-state-machine.ts`
  - Function signature: `transitionState(escrowHoldId, toState, actorId, reason)`
  - Transition for disputes: HELD → DISPUTED
  - Transition for resolution: DISPUTED → RELEASED (merchant favor) or DISPUTED → REFUNDED (employee favor)
  - All state changes automatically logged in `escrow_audit_log`
  - Validation prevents invalid transitions
- **Transaction Detail Page**: Exists at `(dashboard)/employee/transactions/[id]/page.tsx`
  - Add "Report Issue" button to this page
  - Reuse existing transaction data fetching logic
  - Extend escrow status badge to include DISPUTED state
- **Email Notification Pattern**: React Email templates in `src/components/emails`
  - Use `sendConfirmationEmails()` pattern from Story 3.3
  - Create new templates: `employee-dispute-submitted.tsx`, `merchant-dispute-notification.tsx`, `admin-dispute-notification.tsx`
  - Send via Resend API in `src/server/actions/notifications.ts`
  - Batch sending for efficiency (send to employee + merchant + admin together)
- **Server Actions Pattern**: Define in `src/server/actions/` directory
  - Use Zod for input validation
  - Return standardized response: `{ success: boolean, data?: T, error?: string }`
  - Use `db.transaction()` for atomic operations
- **Database Transaction Pattern**: Use for atomic operations (state change + dispute creation + email)
  - Pattern: `await db.transaction(async (tx) => { ... })`
  - If any step fails, all changes are rolled back
- **Testing Infrastructure**: Vitest configured with passing tests
  - Test files in `src/**/__tests__/*.test.ts` pattern
  - Mock Paystack API using `vi.fn()` and `vi.spyOn()`
  - Mock Resend email using same pattern
  - Use `describe`, `it`, `expect` from Vitest
- **Authorization Pattern**: Verify user owns the transaction
  - Check `transactions.user_id` matches authenticated user ID (from Clerk)
  - Use Clerk's `auth()` helper to get current user ID
- **Paystack Integration**: Payment infrastructure available
  - Use `releaseFundsToMerchant()` for merchant-favor resolutions (reuse from Story 3.3)
  - Create new `refundTransaction()` for employee-favor resolutions
  - Idempotency keys prevent duplicate operations

[Source: docs/sprint-artifacts/3-3-employee-confirmation-workflow.md#Dev-Agent-Record]

### Architecture Patterns

**Dispute Creation Flow:**
1. Employee clicks "Report Issue" on transaction detail page
2. Navigate to dispute form page
3. Upload evidence files (photos, documents) to Vercel Blob
4. Submit dispute with description and evidence URLs
5. `createDispute` Server Action validates and transitions escrow state (HELD → DISPUTED)
6. Create dispute record in database
7. Send notification emails to employee, merchant, and admin
8. Update transaction status to DISPUTED
- [Source: docs/epics.md#story-34, docs/architecture.md#epic-to-architecture-mapping]

**Dispute Resolution Flow:**
1. Admin reviews dispute in admin portal (deferred to Epic 6)
2. Admin selects resolution: EMPLOYEE_FAVOR or MERCHANT_FAVOR
3. `resolveDispute` Server Action validates and updates dispute record
4. If EMPLOYEE_FAVOR: Transition DISPUTED → REFUNDED, trigger Paystack Refund
5. If MERCHANT_FAVOR: Transition DISPUTED → RELEASED, trigger Paystack Transfer
6. Send resolution emails to employee and merchant
7. Update transaction status to REFUNDED or SUCCESS
- [Source: docs/epics.md#story-34]

**Vercel Blob File Upload:**
- Install: `npm install @vercel/blob`
- Upload endpoint: `PUT https://blob.vercel-storage.com/[filename]`
- Authentication: Use `BLOB_READ_WRITE_TOKEN` environment variable
- File naming: Use UUID + original extension (e.g., `dispute_123e4567-e89b-12d3-a456-426614174000.jpg`)
- Access control: Files are publicly accessible via URL (consider signed URLs for privacy)
- [Source: docs/architecture.md#file-storage]

**Paystack Refund API:**
- Endpoint: `POST https://api.paystack.co/refund`
- Headers: `Authorization: Bearer [SECRET_KEY]`, `Content-Type: application/json`
- Payload:
  ```json
  {
    "transaction": "trx_xxxxx", // paystack_reference from transactions table
    "amount": 50000, // in kobo (₦500.00), optional (defaults to full amount)
    "merchant_note": "Dispute resolved in employee's favor"
  }
  ```
- Response: `{ "status": true, "message": "Refund has been queued", "data": { "refund_id": "...", "transaction": "..." } }`
- Processing time: T+1 to T+7 (1-7 business days)
- [Source: Paystack API Documentation]

**State Machine Transitions:**
- HELD → DISPUTED (employee creates dispute)
- DISPUTED → RELEASED (admin resolves in merchant's favor)
- DISPUTED → REFUNDED (admin resolves in employee's favor)
- Invalid transitions (automatically prevented by state machine):
  - DISPUTED → HELD (cannot undo dispute)
  - RELEASED → DISPUTED (cannot dispute completed transaction)
  - REFUNDED → DISPUTED (cannot dispute refunded transaction)
- [Source: docs/sprint-artifacts/3-1-escrow-state-machine-core-logic.md]

**Fraud Detection Logic:**
- Calculate dispute rate: (Total Disputes / Total Transactions) × 100
- Threshold: 15% (industry standard for fraud flagging)
- Actions on flagging:
  - Set `users.is_flagged = true`
  - Send admin notification email
  - Add warning banner on user's transaction page
  - Optionally: Require additional verification for future transactions
- [Source: docs/epics.md#story-34]

### UX Design Requirements

**Dispute Form Page:**
- Layout: Card-based design with transaction summary at top
- File upload area: Drag-and-drop zone with dashed border
  - Placeholder: "Drag files here or click to upload (max 3 files)"
  - Accepted formats: JPG, PNG, PDF
  - Max file size: 5MB per file
  - Show upload progress bar
  - Preview uploaded images as thumbnails
  - Allow removal of uploaded files (X button on thumbnail)
- Description textarea: Full-width, 4 rows minimum
  - Placeholder: "Please describe what happened..."
  - Character counter: "0 / 500 characters"
  - Required field indicator (red asterisk)
- Buttons:
  - "Submit Dispute" (Vibrant Coral #FA7921, disabled until description provided)
  - "Cancel" (gray outline, redirect to transaction page)
- Typography: Outfit for headings, Inter for body text
- [Source: docs/ux-design.md#forms]

**Dispute Status Badge:**
- PENDING: Yellow background (#FEF3C7), yellow text (#92400E), "Pending Review"
- UNDER_REVIEW: Blue background (#DBEAFE), blue text (#1E40AF), "Under Review"
- RESOLVED_EMPLOYEE_FAVOR: Green background (#D1FAE5), green text (#065F46), "Resolved - Refunded"
- RESOLVED_MERCHANT_FAVOR: Green background (#D1FAE5), green text (#065F46), "Resolved - Paid"
- Font: Inter, 12px, semibold, uppercase
- Padding: 4px 8px, rounded corners (4px)
- [Source: docs/ux-design.md#badges-and-indicators]

**Transaction Detail Page Updates:**
- Add "Report Issue" button below "Confirm Delivery" button
  - Secondary styling (gray outline)
  - Icon: AlertCircle (from lucide-react)
  - Text: "Report Issue"
  - Visible only when escrow state is HELD
- Add dispute status section (if dispute exists):
  - Heading: "Dispute Status"
  - Show dispute ID, status badge, created date
  - Show resolution notes (if resolved)
  - Add "View Dispute Details" link (navigate to dispute page)
- Disable "Confirm Delivery" button if dispute exists
  - Tooltip: "Cannot confirm delivery while dispute is active"
- [Source: docs/ux-design.md#transaction-pages]

**Responsive Design:**
- Mobile: Stack form fields vertically, full-width buttons
- Tablet: Two-column layout (file upload left, description right)
- Desktop: Same as tablet with wider max-width (800px)
- File upload: Always full-width on mobile
- [Source: docs/ux-design.md#responsive-patterns]

### Testing Standards

**Unit Testing:**
- Test framework: Vitest (configured in prep sprint Day 1)
- Coverage target: 100% for dispute logic
- Test files:
  - `src/server/actions/__tests__/disputes.test.ts` (new)
  - `src/server/actions/__tests__/payments.test.ts` (extend for refunds)
  - `src/lib/__tests__/fraud-detection.test.ts` (new)
- Mock Paystack API calls using Vitest mocks
- Mock Vercel Blob uploads using Vitest mocks
- Mock Resend email using same pattern
- Test valid and invalid inputs
- Test error handling (API failures, network errors, authorization failures)
- [Source: docs/prep-sprint-day-1-complete.md#testing-infrastructure]

**Integration Testing:**
- Test full dispute creation flow
- Test full dispute resolution flow (both employee and merchant favor)
- Use test escrow holds created in previous tests
- Verify state transitions in database
- Verify Paystack Refund API called with correct parameters
- Verify emails sent to correct recipients
- Verify fraud detection triggers correctly
- [Source: docs/testing-guide.md]

**Edge Case Testing:**
- **Already Disputed**: Verify cannot create duplicate dispute for same escrow hold
- **Already Released**: Verify cannot dispute already-released or refunded escrow
- **Unauthorized Access**: Verify user cannot dispute other users' transactions
- **Invalid Files**: Verify file type and size validation works
- **Missing Description**: Verify description is required
- **Fraud Flagging**: Verify users with >15% dispute rate are flagged
- **Paystack Failure**: Verify graceful error handling and rollback
- [Source: docs/epic-3-prep-sprint.md#3-escrow-state-machine]

### Project Structure Notes

**New Files:**
- `(dashboard)/employee/transactions/[id]/dispute/page.tsx` - Dispute form page
- `(dashboard)/merchant/disputes/[id]/page.tsx` - Merchant response page (placeholder)
- `(dashboard)/admin/disputes/[id]/page.tsx` - Admin resolution page (placeholder)
- `src/components/modules/disputes/DisputeForm.tsx` - Dispute form component
- `src/components/modules/disputes/FileUpload.tsx` - File upload component
- `src/components/modules/disputes/DisputeStatusBadge.tsx` - Status badge component
- `src/components/emails/employee-dispute-submitted.tsx` - Employee email template
- `src/components/emails/merchant-dispute-notification.tsx` - Merchant email template
- `src/components/emails/admin-dispute-notification.tsx` - Admin email template
- `src/server/actions/disputes.ts` - Dispute-related Server Actions
- `src/lib/blob-storage.ts` - Vercel Blob upload utility
- `src/lib/fraud-detection.ts` - Fraud detection utility
- `src/server/actions/__tests__/disputes.test.ts` - Unit tests for disputes
- `src/lib/__tests__/fraud-detection.test.ts` - Unit tests for fraud detection

**Modified Files:**
- `src/db/schema.ts` - Add `disputes` table and `is_flagged` field to `users` table
- `src/server/actions/payments.ts` - Add `refundTransaction` function
- `src/server/actions/notifications.ts` - Add `sendDisputeNotifications` function
- `(dashboard)/employee/transactions/[id]/page.tsx` - Add "Report Issue" button and dispute status section

**File Organization:**
- Dispute pages in `(dashboard)/employee/transactions/[id]/dispute/` (Next.js App Router)
- Dispute components in `src/components/modules/disputes/` (feature-specific)
- Email templates in `src/components/emails/` (React Email)
- Server Actions in `src/server/actions/` (business logic)
- Utilities in `src/lib/` (reusable functions)
- Tests colocated with implementation (`__tests__` folders)
- [Source: docs/architecture.md#project-structure]

### Security Considerations

**Authorization:**
- Verify user owns the transaction before allowing dispute creation
- Verify user is admin before allowing dispute resolution
- Prevent users from disputing other users' transactions
- Log all dispute creation and resolution attempts for audit trail
- [Source: docs/architecture.md#security-architecture]

**File Upload Security:**
- Validate file types (whitelist: jpg, png, pdf only)
- Validate file sizes (max 5MB per file)
- Scan uploaded files for malware (optional, consider ClamAV integration)
- Use unique filenames to prevent overwriting
- Consider signed URLs for private evidence files (prevent unauthorized access)
- [Source: docs/architecture.md#file-storage]

**Data Privacy:**
- Do not expose employee evidence URLs to merchant (privacy concern)
- Do not expose merchant evidence URLs to employee (privacy concern)
- Only admin should see both parties' evidence
- Redact sensitive information in emails (e.g., full evidence URLs)
- [Source: docs/architecture.md#data-protection]

**Rate Limiting:**
- Limit dispute creation to 3 per hour per user (prevent abuse)
- Limit file uploads to 10 per hour per user (prevent storage abuse)
- Use Vercel Edge Config or Redis for rate limit tracking
- Return 429 Too Many Requests if limit exceeded
- [Source: docs/architecture.md#security-architecture]

**Input Validation:**
- Validate all inputs with Zod before processing
- Validate escrow_hold_id is valid UUID
- Validate description is non-empty and max 500 characters
- Validate file uploads (type, size, count)
- Validate resolution is valid enum value (EMPLOYEE_FAVOR or MERCHANT_FAVOR)
- Return clear error messages for invalid inputs
- [Source: docs/architecture.md#implementation-patterns]

### Performance Optimizations

**File Upload:**
- Use client-side compression for images (reduce upload time)
- Upload files in parallel (not sequentially)
- Show upload progress for better UX
- Use Vercel Blob's built-in CDN for fast file delivery
- [Source: docs/architecture.md#performance-considerations]

**Database Queries:**
- Index on `disputes.escrow_hold_id` for fast lookups
- Index on `disputes.status` for filtering
- Index on `disputes.created_at` for sorting
- Use joins to fetch dispute + escrow hold + transaction in single query
- [Source: docs/architecture.md#performance-considerations]

**Email Sending:**
- Send emails asynchronously (don't block dispute creation response)
- Use Resend batch sending for employee + merchant + admin emails
- Handle email failures gracefully (log error, don't fail dispute creation)
- [Source: docs/epic-3-prep-sprint.md#2-inngest-cron-jobs]

**Fraud Detection:**
- Cache dispute rate calculations (refresh every 1 hour)
- Use database aggregation for efficient counting
- Run fraud detection asynchronously (don't block dispute creation)
- [Source: docs/architecture.md#performance-considerations]

### Critical Implementation Notes

**⚠️ IMPORTANT: Admin Portal Deferred**

The admin dispute resolution UI is out of scope for Epic 3. Create a placeholder page with "Coming Soon" message. Admin resolution functionality will be implemented in Epic 6 (Employer Admin).

For now, disputes will remain in PENDING status until Epic 6 is complete. Consider creating a manual resolution script for testing purposes.

**⚠️ IMPORTANT: Merchant Portal Deferred**

The merchant response UI is out of scope for Epic 3. Create a placeholder page with "Coming Soon" message. Merchant response functionality will be implemented in Epic 6.

For now, merchants will only receive notification emails but cannot respond via the platform.

**⚠️ IMPORTANT: Refund Processing Time**

Paystack Refunds take 1-7 business days to process (T+1 to T+7). This is slower than Transfers (T+1). Set user expectations correctly in emails and UI.

**⚠️ IMPORTANT: Duplicate Dispute Prevention**

Prevent users from creating multiple disputes for the same escrow hold. Check if a dispute already exists before allowing creation. This prevents abuse and simplifies resolution logic.

**⚠️ IMPORTANT: Evidence Privacy**

Do not expose employee evidence URLs to merchant and vice versa. Only admin should see both parties' evidence. This protects user privacy and prevents retaliation.

### References

- [Epics: Story 3.4](file:///c:/User/USER/perks-app/docs/epics.md#story-34-evidence-based-dispute-resolution)
- [Architecture: File Storage](file:///c:/User/USER/perks-app/docs/architecture.md#file-storage)
- [Architecture: Implementation Patterns](file:///c:/User/USER/perks-app/docs/architecture.md#implementation-patterns)
- [Architecture: Security](file:///c:/User/USER/perks-app/docs/architecture.md#security-architecture)
- [Previous Story: 3-3-employee-confirmation-workflow](file:///c:/User/USER/perks-app/docs/sprint-artifacts/3-3-employee-confirmation-workflow.md)
- [Previous Story: 3-1-escrow-state-machine-core-logic](file:///c:/User/USER/perks-app/docs/sprint-artifacts/3-1-escrow-state-machine-core-logic.md)
- [Epic 3 Prep Sprint](file:///c:/User/USER/perks-app/docs/epic-3-prep-sprint.md)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-11-29: Story drafted by Bob (Scrum Master) via *create-story workflow in #yolo mode
