---
description: Day 2 - Epic 3 Technical Spike (Paystack, Inngest, Escrow Design)
---

# Prep Sprint Day 2: Epic 3 Technical Spike

**Owners:** Charlie (Senior Dev) + Alice (Product Owner)  
**Date:** 2025-11-25  
**Estimated Effort:** 1 full day  
**Success Criteria:** Clear technical plan for Stories 3.1-3.5, Paystack/Inngest ready to use

---

## Context

From Epic 2 Retrospective:
- Epic 3 involves **real money** (escrow, Paystack split payments)
- New infrastructure needed (Inngest cron jobs)
- Complex state machines (escrow lifecycle)
- Must have testing infrastructure (completed Day 1)
- Cannot repeat Epic 1's pattern of mid-epic blockers

**Goal:** Research and prepare all technical dependencies for Epic 3 before starting implementation.

---

## Tasks

### 1. Research Paystack Split Payments API

**Owner:** Charlie (Senior Dev)  
**Estimated Time:** 2 hours

**Actions:**
- [ ] Read Paystack Split Payments documentation (https://paystack.com/docs/payments/split-payments)
- [ ] Understand subaccount creation and management
- [ ] Review transaction split configuration (employer vs merchant percentages)
- [ ] Identify webhook events for split payment confirmations
- [ ] Document API endpoints, request/response formats, error handling
- [ ] Note rate limits and best practices

**Output:** Section in `docs/epic-3-prep-sprint.md` with:
- API endpoints and authentication
- Split payment flow diagram
- Webhook events to handle
- Error scenarios and handling strategy

---

### 2. Set Up Paystack Test Account

**Owner:** Charlie (Senior Dev)  
**Estimated Time:** 30 minutes

**Actions:**
- [ ] Create Paystack test account (https://dashboard.paystack.com/signup)
- [ ] Generate test API keys (public and secret)
- [ ] Add API keys to `.env.local` (DO NOT commit)
- [ ] Add API keys to Vercel environment variables (test mode)
- [ ] Test basic API connection with a simple request
- [ ] Document account setup process

**Output:** 
- Working Paystack test account
- API keys configured in development and Vercel
- Setup instructions in `docs/epic-3-prep-sprint.md`

---

### 3. Research and Set Up Inngest

**Owner:** Charlie (Senior Dev)  
**Estimated Time:** 2 hours

**Actions:**
- [ ] Read Inngest documentation (https://www.inngest.com/docs)
- [ ] Understand cron job scheduling patterns
- [ ] Review Next.js integration guide
- [ ] Create Inngest account and get API keys
- [ ] Install Inngest SDK: `npm install inngest`
- [ ] Set up Inngest serve endpoint in Next.js
- [ ] Create test cron function (simple "hello world" every minute)
- [ ] Verify cron execution in Inngest dashboard
- [ ] Document setup and usage patterns

**Use Case for Epic 3:**
- Story 3.5: Auto-release escrow after 7 days (daily cron job)
- Check all escrows in HELD status
- Release if `createdAt` > 7 days and no disputes

**Output:**
- Working Inngest integration
- Test cron job running
- Setup instructions and patterns in `docs/epic-3-prep-sprint.md`

---

### 4. Design Escrow State Machine

**Owner:** Alice (Product Owner) + Charlie (Senior Dev)  
**Estimated Time:** 2 hours

**Actions:**
- [ ] Define all escrow states:
  - `HELD` - Money held in escrow (initial state)
  - `RELEASED` - Money released to merchant
  - `DISPUTED` - Employee raised a dispute
  - `REFUNDED` - Money refunded to employer
- [ ] Define valid state transitions:
  - `HELD → RELEASED` (manual release or auto-release after 7 days)
  - `HELD → DISPUTED` (employee raises dispute)
  - `DISPUTED → RELEASED` (dispute resolved in merchant's favor)
  - `DISPUTED → REFUNDED` (dispute resolved in employer's favor)
- [ ] Define validation rules for each transition:
  - Who can trigger (employee, employer, system)
  - Required conditions (time limits, dispute evidence)
  - Side effects (Paystack transfers, notifications)
- [ ] Identify edge cases:
  - What if dispute raised on day 6 (before auto-release)?
  - What if Paystack transfer fails during release?
  - What if employer goes bankrupt during escrow?
- [ ] Create state machine diagram (Mermaid or Excalidraw)

**Output:**
- State machine diagram in `docs/epic-3-prep-sprint.md`
- Transition table with validation rules
- Edge case handling strategy

---

### 5. Research Nigerian Payment Compliance

**Owner:** Alice (Product Owner)  
**Estimated Time:** 1.5 hours

**Actions:**
- [ ] Research CBN (Central Bank of Nigeria) payment regulations
- [ ] Identify licensing requirements for escrow services
- [ ] Review consumer protection laws for digital payments
- [ ] Check Paystack's compliance certifications (PCI-DSS, etc.)
- [ ] Identify required disclosures to users (fees, terms, dispute process)
- [ ] Document data retention requirements for financial transactions
- [ ] Note any restrictions on transaction amounts or frequencies

**Key Questions:**
- Do we need a CBN license for escrow? (Likely yes, but Paystack may handle)
- What are the dispute resolution requirements?
- What financial records must we maintain?
- Are there consumer protection laws we must comply with?

**Output:**
- Compliance checklist in `docs/epic-3-prep-sprint.md`
- Risk assessment for regulatory issues
- Action items for legal review (if needed)

---

### 6. Document Deployment Process

**Owner:** Adam (Project Lead) or Charlie (Senior Dev)  
**Estimated Time:** 1 hour

**Actions:**
- [ ] Document Vercel deployment steps in `README.md`:
  - How to connect GitHub repo to Vercel
  - Environment variables setup
  - Build settings and configuration
  - Database migration process (Drizzle push)
  - How to trigger manual deployments
  - How to roll back deployments
  - How to view deployment logs
- [ ] Document local development setup:
  - Clone repo
  - Install dependencies
  - Set up `.env.local`
  - Run database migrations
  - Start dev server
- [ ] Add troubleshooting section for common issues

**Goal:** Reduce bus factor - any team member can deploy if needed.

**Output:**
- Deployment section in `README.md`
- Local setup instructions
- Troubleshooting guide

---

### 7. Consolidate Findings in Epic 3 Prep Sprint Document

**Owner:** Charlie (Senior Dev)  
**Estimated Time:** 1 hour

**Actions:**
- [ ] Create `docs/epic-3-prep-sprint.md`
- [ ] Add sections for each research area:
  - Paystack Split Payments (API docs, setup, flow diagram)
  - Inngest Cron Jobs (setup, patterns, test results)
  - Escrow State Machine (diagram, transitions, validation rules)
  - Nigerian Payment Compliance (checklist, risks, action items)
  - Deployment Process (link to README.md)
- [ ] Add "Readiness Checklist" for Epic 3:
  - [ ] Paystack test account configured
  - [ ] Inngest integration working
  - [ ] Escrow state machine designed
  - [ ] Compliance risks identified
  - [ ] Testing infrastructure ready (from Day 1)
- [ ] Add "Open Questions" section for any blockers
- [ ] Add "Recommended Story Order" based on dependencies

**Output:**
- Complete `docs/epic-3-prep-sprint.md` document
- Clear technical plan for Epic 3
- Confidence to start Story 3.1

---

## Success Criteria

- [ ] Paystack test account set up with API keys in Vercel
- [ ] Inngest integration working with test cron job
- [ ] Escrow state machine fully designed with diagram
- [ ] Nigerian payment compliance risks documented
- [ ] Deployment process documented in README.md
- [ ] `docs/epic-3-prep-sprint.md` complete with all findings
- [ ] No open blockers for Epic 3 Stories 3.1-3.5

---

## Timeline

**Total Time:** ~10 hours (1 full day for 2 people)

| Task | Owner | Time | Start | End |
|------|-------|------|-------|-----|
| Paystack API Research | Charlie | 2h | 9:00 | 11:00 |
| Paystack Test Account Setup | Charlie | 0.5h | 11:00 | 11:30 |
| Inngest Research & Setup | Charlie | 2h | 11:30 | 13:30 |
| **Lunch Break** | - | 1h | 13:30 | 14:30 |
| Escrow State Machine Design | Alice + Charlie | 2h | 14:30 | 16:30 |
| Nigerian Compliance Research | Alice | 1.5h | 9:00 | 10:30 |
| (Alice continues compliance) | Alice | - | 10:30 | 11:00 |
| Deployment Documentation | Adam/Charlie | 1h | 16:30 | 17:30 |
| Consolidate Findings | Charlie | 1h | 17:30 | 18:30 |

---

## Dependencies

**From Day 1 (Must be complete):**
- ✅ Testing infrastructure set up (Vitest, CI/CD)
- ✅ At least 5 passing tests
- ✅ Lighthouse PWA audit complete
- ✅ Browse Deals hotfix verified

**Blockers:**
- None expected - all research and setup tasks

---

## Deliverables

1. **Paystack Integration Ready**
   - Test account configured
   - API documentation reviewed
   - Flow diagram created

2. **Inngest Integration Ready**
   - SDK installed and configured
   - Test cron job running
   - Usage patterns documented

3. **Escrow State Machine Designed**
   - All states and transitions defined
   - Validation rules documented
   - Edge cases identified

4. **Compliance Risks Identified**
   - CBN regulations reviewed
   - Risk assessment complete
   - Action items for legal review

5. **Deployment Process Documented**
   - README.md updated
   - Team can deploy independently

6. **Epic 3 Prep Sprint Document**
   - All findings consolidated
   - Readiness checklist complete
   - Clear path to start Epic 3

---

## Notes

- **Focus:** Research and preparation, not implementation
- **Goal:** Prevent mid-epic blockers (like Epic 1)
- **Outcome:** Confidence to start Epic 3 with all dependencies ready
- **Next Step:** Begin Epic 3 Story 3.1 (Escrow State Machine) with 100% test coverage

---

**Charlie:** "Let's make this prep sprint count. Epic 3 is complex - we need to be ready."

**Alice:** "Agreed. I'll handle compliance research while you tackle the technical integrations."

**Adam:** "I'll document the deployment process this afternoon. Let's ship this prep work properly."
