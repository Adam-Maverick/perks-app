# Stipends - Product Requirements Document

**Author:** Adam  
**Date:** 2025-11-21  
**Version:** 1.0

---

## Executive Summary

Stipends is a full-stack B2B2C financial wellness platform addressing the financial stress crisis affecting Nigerian employees. The platform combines a **verified merchant marketplace with employer-funded stipends, BNPL financing, and escrow protection** to create a tri-sided value ecosystem that serves employees, employers, and merchants simultaneously.

The platform's timing is exceptional, leveraging Nigeria's Tax Act 2025 as a regulatory tailwind that provides employers with 150% tax deductibility on employee welfare spending—effectively making the platform "self-funding" while solving critical retention challenges in a competitive talent market.

### What Makes This Special

**Stipends is the only platform in Nigeria that combines three trust-building layers** (merchant vetting + escrow protection + employer endorsement) **with three financial enablement mechanisms** (discount aggregation + BNPL affordability + employer-funded stipends). This creates a defensible moat against both pure discount platforms and standalone BNPL providers.

The **tax optimization positioning** transforms Stipends from a "cost center" to a "tax shield" for employers, while the **B2B2C distribution model** solves the chicken-and-egg problem by leveraging employer partnerships to drive both sides of the marketplace simultaneously. The localized focus on Nigerian trust concerns (addressing scam fears through multi-layer verification) and Naira-based operations creates barriers to entry for international players.

---

## Project Classification

**Technical Type:** SaaS B2B (B2B2C Platform)  
**Domain:** Fintech  
**Complexity:** High

This is a greenfield, enterprise-track B2B2C SaaS platform operating in the high-complexity fintech domain. The technical architecture must support:

- Multi-tenant employer accounts with SSO and payroll integrations
- Complex payment flows (escrow, BNPL, stipend wallets, merchant settlements)
- Three distinct user portals (employees, employers, merchants)
- Regulatory compliance (CBN, NDPR, FCCPC, PCI-DSS)
- Real-time transaction processing and reconciliation

### Domain Context

**Fintech Compliance Requirements:**

As a Nigerian fintech platform handling BNPL lending and payment processing, Stipends must navigate:

- **CBN Regulatory Path**: Payment Service Provider (PSP) license required; BNPL-specific licensing currently under regulatory review (9-12 month approval timeline)
- **KYC/AML Requirements**: BVN verification for BNPL eligibility; employment verification as additional layer
- **Data Privacy (NDPR)**: Explicit consent for credit checks, employer analytics; data minimization; breach notification \u003c72hrs
- **PCI DSS Compliance**: Payment data tokenization via gateway (Paystack); no card storage
- **Consumer Protection (FCCPC)**: Transparent pricing, dispute resolution procedures, escrow release policies

**De-Risking Strategy**: Build proprietary BNPL infrastructure in-house (Phase 2-3) to ensure ethical lending standards, launching only after full regulatory approval.

**Security Architecture Mandatory**: End-to-end encryption, payment tokenization, 2FA for employer admins, quarterly penetration testing, incident response protocols.

---

## Success Criteria

**North Star Metric**: **Total Tax Savings Generated for Employers** - Cumulative value of tax deductions unlocked via platform usage.

This metric aligns perfectly with the "Tax Optimization" wedge. It proves immediate ROI to the payer (employer) while implicitly requiring high employee adoption (since deductions are based on employee welfare spending).

### Primary Success Indicators

**Employee Engagement \u0026 Value Delivery:**
- **Activation Rate**: 40%+ of employees actively using platform within 90 days of employer onboarding (measures employer-to-employee conversion)
- **Monthly Active Users (MAU)**: Sustained usage with 2+ transactions/month (indicates habit formation)
- **Average Savings per Employee**: ₦5,000-₦8,000/month (validates value proposition)
- **Employee NPS**: 50+ (measures word-of-mouth potential)

**Employer Retention \u0026 ROI:**
- **Employer Retention Rate**: 85%+ at 12 months (platform stickiness)
- **Stipend Feature Adoption**: 30% of employers funding stipend wallets by Month 12 (premium feature conversion)
- **Tax Optimization Utilization**: 60%+ of employers generating tax compliance reports (validates strategic value-add)
- **Employer NPS**: 50+ (decision-maker satisfaction)
- **Ecosystem Retention Rate**: 20%+ of employees retaining Stipends account after changing jobs (validates debt portability and ecosystem stickiness)

**Merchant Ecosystem Health:**
- **Merchant Retention**: 80%+ at 6 months (discount sustainability)
- **Merchant NPS**: 40+ (platform value for merchant acquisition)
- **Discount Sustainability**: 10-20% average discounts maintained over time
- **Transaction Volume per Merchant**: Growing trend indicating employee engagement

**BNPL Performance (Phase 4+ only):**
- **On-Time Repayment Rate**: 85%+ (via payroll deduction reliability)
- **Default Rate**: <15% in first 12 months (risk management effectiveness)
- **BNPL Utilization Rate**: 30%+ of active employees using BNPL feature

### Business Metrics

**Phase 1 (Months 1-6) - Marketplace + Escrow Proof-of-Concept:**
- Target: 15 employer clients, 6,000+ registered employees, 2,400 MAU (40% activation)
- Revenue: ₦18M (Merchant commission ₦12M + Employer subscriptions ₦6M)
- Success Gate: Validate B2B2C marketplace adoption without BNPL dependency

**Phase 2 (Months 7-12) - Scale & Build:**
- Target: 30 employer clients, 15,000 registered employees, 6,000 MAU
- Revenue: ₦30M (Merchant commission ₦22M + Employer subscriptions ₦8M)
- Success Gate: Merchant ecosystem maturity and BNPL infrastructure readiness

**Phase 3 (Months 13-18) - Regional Expansion:**
- Target: 60 employer clients, 30,000 registered employees, 12,000 MAU
- Revenue: ₦43M (Merchant commission ₦28M + Employer subscriptions ₦15M)
- Success Gate: Lagos model replicable in Abuja and Port Harcourt

**Unit Economics (Steady State):**
- Revenue per active user/month: ₦1,875
- Cost to serve per user: ₦450
- Contribution margin: ₦1,425/user/month (76%)

**Break-Even Target:** 14,000 active users OR 235 employer clients (estimated Month 30-36)

---

## Product Scope

### MVP - Minimum Viable Product (Phase 1: Months 1-6)

**Core Value Proposition**: Trusted marketplace + Escrow protection + Employer endorsement (BNPL deferred to Phase 2)

**Must-Have Features (Functional Requirements):**

1. **User Account & Portability (The "Freedom" Core)**
   - **FR1**: Employees can create accounts via Employer SSO or unique invitation code.
   - **FR2**: **Debt Portability**: Employees can transfer their account, history, and active balances to a new employer code without loss of data.
   - **FR3**: **Tax Shield View**: Employees can view their personal contribution to their employer's tax savings (gamification).

2. **Verified Merchant Marketplace**
   - **FR4**: Merchant directory with "Verified" (Trusted) and "Emerging" (Escrow-Protected) badges.
   - Deal browsing with category filters (Food, Transport, Utilities, Electronics, Wellness)
   - Search functionality with location-based recommendations
   - Auto-apply discount codes at checkout
   - Real-time inventory validation via merchant webhook

3. **Escrow Protection System**
   - **FR5**: **Auto-apply to Emerging Brands** (new/unverified merchants) to build trust.
   - Payment split at checkout (platform commission, escrow hold) - **No extra fee to user**.
   - "Protected Purchase" badge on eligible transactions.
   - **FR6**: Employee confirmation workflow (app-based confirmation or QR code scan) to release funds.
   - **FR7**: Evidence-based dispute resolution (photo upload) within 14-day window.
   - **FR8**: **Auto-Release**: System releases funds after 14 days of inactivity.
   - **FR11**: Notification reminders on Day 7 and 12 to confirm delivery.

3. **Employee Portal (Progressive Web App)**
   - SSO registration via company email (minimal friction onboarding)
   - Personalized deal feed based on location, employer, and preferences
   - Savings dashboard (cumulative savings, monthly progress, category breakdown)
   - Transaction history with digital receipt storage
   - Referral program with incentives (₦500 per successful referral)
   - Push notifications for deal alerts and transaction updates

4. **Employer Admin Dashboard (Web)**
   - Employee roster management (CSV upload or HR system API sync)
   - Stipend wallet funding and allocation (optional premium feature)
   - Usage analytics (activation rate, savings generated, engagement metrics, ROI calculator)
   - Communication templates for internal promotion (email, Slack, poster PDFs)
   - Compliance reporting (tax optimization reports per 2025 Tax Act)

5. **Email Marketing + PWA Distribution**
   - Weekly curated deal emails (1-2 high-value offers to company inbox)
   - Employer-branded email templates (trust signal via company sender)
   - Click-through tracking and A/B testing capabilities
   - Mobile-optimized deep linking from email to specific PWA pages
   - Low-bandwidth optimization for Nigerian network infrastructure

6. **Tax Compliance Features (Nigeria Tax Act 2025)**
   - Rent receipt generation for employee tax relief (proof of payment for new Rent Relief requirement)
   - Employer welfare spending report (supports 50% additional tax deduction claim)
   - Tax savings calculator (shows employee + employer savings under 2025 provisions)
   - *Note: Strategy pending validation with Nigerian tax experts*

**MVP Success Criteria:**
- 1 anchor employer (500+ employees) signed and launched
- 30+ merchants signed (15 high-frequency food/transport, 15 variety mix)
- 40%+ employee activation at pilot employer within 90 days
- 80%+ merchant retention maintaining discounts
- <5% escrow dispute rate
- NPS >30 from all stakeholder groups

### Growth Features (Phase 2: Months 7-12)

**Strategic Focus**: Scale marketplace while building proprietary BNPL infrastructure

1. **BNPL Infrastructure Build (Internal)**
   - Develop proprietary credit scoring engine using payroll data
   - Build loan ledger and repayment scheduling system
   - **Note:** No public BNPL launch in Phase 2 (Development only)

2. **Payroll API Integrations**
   - OAuth connections to Seamfix, WorkPay, CloudPay (Nigerian payroll providers)
   - Webhook notifications for monthly payroll cycles
   - Reconciliation report generation and download

3. **Advanced Employee Features**
   - Bill payment reminders and subscription management
   - Financial wellness content library (budgeting tips, savings challenges)
   - Savings goals tracker with progress visualization
   - Colleague deal recommendations (social proof within company)

4. **Merchant Growth Tools**
   - Performance analytics dashboard (sales volume, customer acquisition cost, retention)
   - Co-marketing campaign builder (joint promotions with platform)
   - Featured placement opportunities (premium merchant tier)

5. **Employer Premium Features**
   - Department-level budget allocation and analytics
   - Custom approval workflows for large stipend allocations
   - Integration with HRIS systems (BambooHR, Workday connectors)
   - White-glove customer success manager assignment

### Vision Features (Phase 3: Months 13-18+)

**Strategic Evolution**: Proprietary BNPL engine + Regional expansion + Ecosystem maturity

1. **Proprietary BNPL Infrastructure**
   - Build credit scoring engine with Nigerian employment data
   - Apply for CBN BNPL/lending license
   - Loan ledger and repayment scheduler (migrate from partner white-label)
   - Graduated credit limits based on repayment history

5. **Merchant Ecosystem Maturity**
   - Merchant self-service portal (upload deals, manage inventory, view analytics)
   - Inventory API integration for real-time stock updates
   - Performance-based merchant tiers (rewards for high NPS, sales volume)
   - Group buying features (employee coalitions for bulk discounts)

6. **Platform Expansion**
   - Open API for third-party integrations (expense management tools, fintech partners)
   - Crypto/stablecoin payment options (de-risk Naira volatility)
   - International remittance integration (diaspora family support use case)

**Explicitly Out of Scope:**
- Lending/credit beyond BNPL (no personal loans or overdrafts)
- Investment products (focus on spending optimization, not wealth management)
- Insurance products (potential partnership opportunity, not direct offering)
- Physical retail locations (fully digital distribution model)

---

## Non-Functional Requirements (NFRs)

Given the Nigerian context (network challenges) and Fintech nature (trust/compliance), these requirements are critical for success.

### Performance & Reliability
- **NFR1 (Speed)**: PWA First Contentful Paint < 2s on 3G networks (Critical for adoption in low-bandwidth areas).
- **NFR2 (Offline Mode)**: Users can browse cached deals and view saved vouchers without active internet connection.
- **NFR3 (Availability)**: 99.9% uptime during business hours (8am - 8pm WAT).

### Security & Compliance
- **NFR4 (Auth)**: 2FA enforced for all Employer Admin and Merchant accounts.
- **NFR5 (Data Privacy)**: All PII and financial data encrypted at rest (AES-256) and in transit (TLS 1.3) - *NDPR Requirement*.
- **NFR6 (Auditability)**: Immutable audit logs for all escrow releases, stipend allocations, and dispute resolutions.

### Usability
- **NFR7 (Mobile Responsiveness)**: UI must be fully functional on screens as small as 320px width (supporting older Android devices common in target demographic).

---

