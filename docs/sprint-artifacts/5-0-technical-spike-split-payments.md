# Story 5.0: Technical Spike - Split Payment Atomicity

**Epic:** 5 - Employee Wallet & Stipends
**Status:** Drafted
**Type:** Technical Spike

## Goal
Design and prototype a robust "Split Payment" mechanism to handle scenarios where a purchase exceeds the wallet balance, requiring a partial card charge.

## Problem Statement
When a user buys an item for ₦10,000 but only has ₦4,000 in their wallet:
1.  We must debit ₦4,000 from the wallet (Database).
2.  We must charge ₦6,000 to their card (Paystack API).
3.  **Critical Risk:** If Step 2 fails (declined card), Step 1 must generally be rolled back (or never committed). If Step 2 succeeds but Step 1 was never committed, we lose money.

## Scope (Time-Box: 2 Days)

### Research Questions
1.  **Concurrency:** How do we lock the wallet balance while waiting for user card input?
2.  **Atomicity:** Can we use a "Two-Phase Commit" pattern?
    - Phase 1: "Reserve" wallet funds (State: PENDING_SPEND).
    - Phase 2: Charge Card.
    - Phase 3: If Card Success → Commit Wallet Spend. If Card Fail → Release Wallet Reservation.
3.  **Paystack capabilities:** Does Paystack support "Auth and Capture" or do we use standard Charge?

### Deliverables
1.  **Architecture Diagram:** Updated `architecture.md` with the "Split Payment State Machine".
2.  **PoC Code:** A standalone script proving the "Reserve-Charge-Commit" flow works (using mock Paystack or Test Mode).
3.  **Recommendation:** Go/No-Go on supporting split payments for MVP.

## Tasks
- [ ] Research "Reservation Pattern" for wallet balances.
- [ ] Create simple PoC script `scripts/poc-split-payment.ts`.
- [ ] Document failure scenarios (Network timeout, Webhook delay).
- [ ] Update `architecture.md` with recommended design.

## Acceptance Criteria
- [ ] PoC demonstrates successful "Commit" path (Wallet Debited + Card Charged).
- [ ] PoC demonstrates successful "Rollback" path (Card Declined → Wallet Reservation Released).
- [ ] Documented handle for "Zombie Transactions" (Reserved but never completed).
