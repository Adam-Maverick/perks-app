# Stipends - Brainstorming & Strategic Analysis Session
**Date:** 2025-11-20  
**Facilitated by:** Mary (Business Analyst)  
**Participant:** Adam

---

## Project Overview

**Mission:** Full-stack employee financial wellness platform addressing financial stress in Nigerian workforce

### Problem Statement (Root Cause Analysis - Five Whys)

Nigeria's inflation is reducing incomes while salaries remain stagnant and cost of living rises. Employees have little left to save. Most companies offer no benefits beyond salary and health insurance. Young professionals are financially stretched with no access to discounts, perks, or financial wellness programs.

**ROOT ISSUE:** Fear of scams/fake products from unverified emerging brands creates barrier to accessing savings + Employers need zero-cost retention tool to compete for talent in tough economic climate.

### Solution: B2B2C Financial Wellness Ecosystem

Full-stack platform combining verified merchant marketplace, financing, and employer benefits:

#### CORE FEATURES:
1. **Verified Merchant Marketplace** - Aggregated discounts from established + emerging brands
2. **Buy-Now-Pay-Later (BNPL)** - Spread payments over time with minimal interest (solves affordability gap)
3. **Employer Stipend Funding** - Monthly/quarterly allowances funded by employers into employee accounts
4. **Escrow Protection** - For emerging brands, funds held until employee confirms satisfaction
5. **Payroll Integration** - Seamless integration with company payroll systems for BNPL deductions
6. **Email-First Engagement** - 1-2 curated deals per week to company email (reduces app fatigue)

#### Key Differentiators:
- Multi-layer trust: Vetting + Escrow + Employer endorsement
- Financial enablement: Discounts + BNPL + Employer funding (not just savings)
- Enterprise integration: Payroll systems, SSO, company email channels
- Localized focus: Nigeria-specific vetting, Naira-based, addresses local fraud concerns

---

## Target Users & Stakeholder Mapping

### PRIMARY STAKEHOLDERS (High Influence × High Interest):
- **Employer HR/Benefits Teams** - Decision makers for platform adoption
- **Major Merchant Partners** - Drive value proposition with popular brands
- **Early Adopter Employees** - Influence peer adoption and platform reputation

### SECONDARY STAKEHOLDERS:
- **Payroll/IT Teams** - Technical integration required
- **Emerging Merchants** - High interest but limited bargaining power
- **Investors/Funders** - Focus on ROI and scalability metrics

### TERTIARY:
- **Regulatory Bodies** - FCCPC (consumer protection), CBN (BNPL/lending regulations), NITDA (data privacy/NDPR)
- **End-user Employees** - High interest, low individual influence (aggregate matters)

---

## User Journey Critical Moments

1. **AWARENESS:** Employer-endorsed email announcement (trust signal)
2. **REGISTRATION:** SSO/work email verification (minimal friction)
3. **DISCOVERY:** Curated deals with trust badges, social proof ("X employees saved ₦Y")
4. **REDEMPTION:** Auto-apply codes, escrow protection, real-time validation
5. **POST-PURCHASE:** Savings dashboard, gamification, referral incentives
6. **ADVOCACY:** Shareable deals, colleague recommendations in workplace channels

---

## Value Proposition by User Type

### FOR EMPLOYEES:
- Trusted savings through verified merchants (addresses scam fears)
- Affordability through BNPL (solves "can't afford even with discount" problem)
- Employer-funded stipends (actual allowances, not just discounts)
- Time savings through aggregation (one platform vs. multiple sites)
- Financial wellness (cumulative savings tracking, budgeting insights)

### FOR EMPLOYERS:
- Zero-cost retention tool (base platform)
- Optional funding feature for competitive advantage
- Payroll-integrated administration (minimal HR overhead)
- Employee wellness data and engagement metrics
- Talent attraction and employer branding

### FOR MERCHANTS:
- Access to verified, employed customer segment
- Bulk customer acquisition through employer partnerships
- Platform credibility boost (especially for emerging brands)
- Escrow-enabled trust for customer acquisition
- Sales volume and brand exposure

---

## Revenue Model

- **BNPL interest/fees** (primary revenue for affordability gap)
- **Merchant commission on sales** (marketplace take rate)
- **Employer subscription for stipend funding feature**
- **Transaction fees on escrow releases**
- **Premium employer features** (white-label, advanced analytics)

---

## Competitive Positioning

**DIFFERS FROM:**
- **Simple discount sites** (Groupon, deals.com.ng) - we add BNPL + escrow + employer integration
- **BNPL platforms** (Credpal, Carbon) - we add verified marketplace + employer benefits
- **International players** (Amazon, Jumia) - localized trust vetting, Naira-focused, affordable for low-earners

**COMPETITIVE MOAT:** Employer partnerships (B2B2C model) + Trust layer (vetting + escrow) + Local market focus

---

## Strategic Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Platform fatigue | Email-first (1-2 deals/week to work email), not another app |
| Discount sustainability | Diverse merchant base, bulk customer value proposition |
| Vetting scalability | Escrow system for emerging brands (auto-release with notifications) |
| Employer ROI proof | Retention metrics, stipend funding option, payroll integration |
| Regulatory (BNPL licensing) | CBN compliance, NDPR data privacy, payment service provider license |

---

## Technical Complexity

- Payment infrastructure (escrow management, BNPL credit assessment, payroll deductions)
- Multi-party transaction reconciliation (employee, employer, merchant)
- Enterprise integrations (SSO, payroll systems, HR platforms)
- Credit risk assessment for BNPL eligibility
- Security and compliance (NDPR, CBN regulations, PCI-DSS)

---

## Success Metrics

- Employee activation rate (% of employees using platform after employer onboarding)
- Monthly active users and transaction frequency
- Average savings per employee per month
- Employer retention rate (platform stickiness)
- Merchant satisfaction (repeat participation, discount sustainability)
- BNPL repayment rates and default metrics
- NPS (Net Promoter Score) from all stakeholder groups

---

# STRATEGIC RISK ANALYSIS (Pre-mortem)

## FAILURE SCENARIO 1: Chicken-and-Egg Death Spiral

**Risk:** Can't get merchants without users, can't get users without merchants

**Warning Signs:**
- <15% employee activation in first pilot
- Merchant churn at month 6

**Prevention:**
- Launch with anchor tenant (500+ employee employer)
- Pre-sign 30+ merchants before launch
- Subsidize initial merchant discounts
- Set 40% activation milestone in 90 days

---

## FAILURE SCENARIO 2: Regulatory Roadblock

**Risk:** BNPL licensing delays 9+ months, competitor captures market while awaiting approval

**Warning Signs:**
- CBN approval drags past month 6
- Competitor announces employer feature

**Prevention:**
- Start regulatory process NOW
- Launch MVP without BNPL first (phase 2 addition)
- White-label BNPL with licensed provider (Credpal/FairMoney partnership)

---

## FAILURE SCENARIO 3: BNPL Default Crisis

**Risk:** 35% default rate destroys unit economics, merchant payouts delayed, reputation ruined

**Warning Signs:**
- Default rate >15% in first 4 months
- Merchant settlement complaints

**Prevention:**
- Conservative credit limits (₦5k-₦20k)
- Employer payroll deduction required
- Partner with credit bureaus (CRC, FirstCentral)
- Reserve fund for merchant payouts

---

## FAILURE SCENARIO 4: Escrow Abuse & Fraud

**Risk:** Employees falsely claim dissatisfaction, merchants lose revenue and abandon platform

**Warning Signs:**
- 25% dispute rate (vs 5% expected)
- Top merchants threatening to leave

**Prevention:**
- Evidence-based dispute resolution
- Limit escrow to first purchase with merchant
- Auto-release after 14 days
- AI fraud detection
- Merchant protection policy

---

## FAILURE SCENARIO 5: Employer Apathy

**Risk:** Employers don't promote internally, usage flatlines at 8%, renewal jeopardized

**Warning Signs:**
- Single launch email and no follow-up
- No internal champions
- HR unresponsive

**Prevention:**
- White-glove onboarding
- Co-create launch campaign
- Ready-made comm templates
- Dedicated customer success manager
- Gamification (savings leaderboards)
- Quarterly business reviews

---

# EXTERNAL ENVIRONMENT ANALYSIS (PESTLE)

## POLITICAL:

**Opportunities:**
- Government focus on employment/empowerment
- Potential tax incentives for employee benefits

**Threats:**
- Policy uncertainty
- Forex restrictions
- Fintech lending scrutiny

**Action:** Engage FinTech NGR association, maintain compliance as competitive advantage

---

## ECONOMIC:

**Opportunities:**
- High inflation drives savings demand
- Employer talent competition
- Local deals attractive vs imports

**Threats:**
- Recession reduces discretionary spending
- Unemployment shrinks target market
- Currency volatility

**Action:** Focus on essentials (food, utilities, healthcare), conservative BNPL limits, dynamic pricing

---

## SOCIAL:

**Opportunities:**
- Digital adoption rising
- Wellness awareness growing
- Demand for trusted platforms
- Peer influence culture

**Threats:**
- BNPL debt stigma
- Privacy concerns (employer tracking)
- Digital divide
- Cash preference in some regions

**Action:** Frame BNPL as "smart budgeting", clear privacy policy (aggregate data only), offline redemption options

---

## TECHNOLOGICAL:

**Opportunities:**
- Mobile-first infrastructure
- Cloud scaling
- AI for personalization/fraud
- Payroll API integrations

**Threats:**
- Cybersecurity risks (breach destroys trust)
- Network infrastructure challenges
- Rapid competitor copying

**Action:** Heavy security investment (PCI-DSS), PWA for low-bandwidth, partner with payment processors, leverage employer partnerships as moat

---

## LEGAL:

**Opportunities:**
- Consumer protection laws favor verified platforms
- NDPR compliance advantage

**Threats:**
- BNPL licensing (CBN)
- Consumer protection regulations (FCCPC)
- NDPR fines
- Labor law payroll restrictions

**Action:** Fintech legal counsel, transparent terms/privacy, partner with licensed BNPL initially, proactive compliance

---

## ENVIRONMENTAL:

**Opportunities:**
- ESG focus among multinationals
- Sustainability segment growing
- Eco-friendly brand features

**Threats:**
- Climate impacts supply chains/logistics
- Limited environmental regulation

**Action:** Highlight sustainable brands, ESG reporting for employers, future differentiator (not MVP priority)

---

# FINANCIAL PROJECTIONS (18-Month MVP)

## COST BREAKDOWN:

**Development:** ₦34M-₦55M (~$40k-$65k)
- Platform, BNPL integration, payroll APIs, escrow infrastructure

**Operations:** ₦342M (18 months)
- Staff (₦12M/mo), cloud (₦800k/mo), vetting team, marketing, legal

**Regulatory:** ₦13M-₦22M  
- CBN BNPL license, legal/compliance consulting

**TOTAL INVESTMENT:** ₦389M-₦419M (≈$460k-$500k USD)

---

## REVENUE PROJECTIONS:

**Year 1 (Months 1-12):** ₦30M
- Merchant commission ₦15M
- BNPL fees ₦9M
- Employer subscriptions ₦6M

**Months 13-18:** ₦60M
- Merchant commission ₦28M
- BNPL fees ₦17M
- Employer subscriptions ₦15M

**18-MONTH TOTAL:** ₦90M (~$108k USD)

---

## UNIT ECONOMICS (Steady State):

- Revenue per active user/month: ₦1,875
- Cost to serve per user: ₦450
- **Contribution margin: ₦1,425/user/month (76%)**

---

## BREAK-EVEN ANALYSIS:

- **Requires:** 14,000 active users OR 235 employer clients (at 60 active users per employer)
- **Timeline:** Month 30-36 (at 5 employer clients/month acquisition rate)

---

## RECOMMENDED PHASED APPROACH:

**Phase 1 (Months 1-6):** Discount marketplace + escrow only (₦80M cost)
- Goal: Prove employer adoption
- **Investor Milestone:** 10 employer clients, 40%+ activation rate

**Phase 2 (Months 7-12):** Add BNPL via partner (de-risk regulatory)

**Fundraise:** ₦300M-₦500M Series A after Phase 1 traction

**Phase 3 (Months 13-24):** Scale to 100+ employers, build proprietary BNPL

---

## DE-RISKING TACTICS:

- Partner with existing BNPL provider (revenue share vs building)
- Focus on high-margin employer subscription feature early
- Start lean: 4 people vs 8, outsource non-core functions

---

# SECURITY & FRAUD PREVENTION (Red Team)

## ATTACK VECTOR 1: Escrow Exploitation

**Threat:** Fake employee accounts, accomplice merchants, drain escrow funds

**Countermeasures:**
- Enhanced merchant vetting (CAC registration, bank verification, physical address)
- Transaction limits (₦10k max first month)
- Velocity checks (IP/device)
- 7-day fund release delay

---

## ATTACK VECTOR 2: BNPL Default Fraud

**Threat:** Employee maxes out BNPL, quits job before payroll deduction, platform can't recover

**Countermeasures:**
- 6-month employment tenure requirement
- 20% down payment on high-value items
- Employer deduction from final paycheck agreement
- Credit bureau reporting
- Graduated limits

---

## ATTACK VECTOR 3: Review Manipulation

**Threat:** Paid fake positive reviews or competitor negative reviews destroy trust

**Countermeasures:**
- Verified purchase requirement
- Authenticity signals
- Suspicious pattern detection
- Review moderation team
- Merchant performance metrics beyond reviews

---

## ATTACK VECTOR 4: Data Breach & Privacy Violation

**Threat:** Database hack, employee data stolen, identity theft, NDPR violations (₦10M+ fines)

**Countermeasures:**
- End-to-end encryption
- Payment data tokenization (PCI-DSS)
- Quarterly penetration testing
- Bug bounty program
- Incident response plan
- Cyber insurance policy

---

## ATTACK VECTOR 5: Employer Account Takeover

**Threat:** Compromised HR admin credentials, fake employees added, stipend balances stolen

**Countermeasures:**
- Mandatory 2FA for admins
- Approval workflow (2 admins for >10 employee additions)
- Anomaly alerts (bulk adds)
- Audit logs
- Employer fraud insurance

---

# OPERATIONAL BLUEPRINT (Service Design)

## FRONTSTAGE (Customer-Facing):

1. **Discovery:** Personalized deal browsing, trust signals (ratings, social proof)
2. **BNPL Check:** Eligibility display, transparent breakdown (installments + fees)
3. **Checkout:** Order review, payroll deduction consent, confirmation
4. **Delivery:** Merchant fulfillment, tracking updates
5. **Payment:** Auto-deduction from salary, progress notifications

---

## BACKSTAGE (Invisible Operations):

1. **Discovery Backend:** Personalization engine, deal ranking algorithm, A/B testing
2. **Eligibility Backend:** Credit scoring API, risk engine, employment tenure verification
3. **Checkout Backend:** Inventory check, BNPL contract creation, payroll notification queue, merchant advance payment
4. **Delivery Backend:** Fulfillment webhook monitoring, escrow timer, customer service escalation
5. **Payment Backend:** Payroll API trigger (monthly), employer deduction, contract updates, missed payment escalation

---

## SUPPORT PROCESSES:

**Technology:** Cloud infrastructure, databases, payment gateway, payroll integrations, credit scoring, analytics

**Merchant Vetting:** Application review, business verification (CAC, bank), product quality check, ongoing monitoring

**Customer Support:** Employee chat support, merchant dashboard assistance, employer integration help, dispute resolution

**Finance & Compliance:** Reconciliation (merchant payouts vs employee repayments), risk monitoring, regulatory reporting, audits

**Marketing & Growth:** Employer sales pipeline, employee activation campaigns, merchant acquisition, referral programs

---

## CRITICAL DEPENDENCIES:

- Payroll integration reliability (single point of failure for BNPL)
- Merchant fulfillment quality (platform doesn't control, but reputation depends on it)
- Credit scoring accuracy (bad decisions = high defaults)

---

## SCALE OPTIMIZATION OPPORTUNITIES:

- Self-service merchant dashboard (reduce support load)
- Automated dispute resolution (scale escrow feature)
- Predictive default alerts (proactive outreach before missed payment)

---

**Session completed with comprehensive strategic foundation for investor-grade planning.**
