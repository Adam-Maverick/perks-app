# Stipends UX Design Specification

_Created on 2025-11-22 by Adam_
_Generated using BMad Method - Create UX Design Workflow v1.0_

---

## Executive Summary

Stipends is a B2B2C financial wellness platform for Nigeria that combines a verified merchant marketplace, employer-funded stipends, and escrow protection. It aims to solve the "trust deficit" and "affordability gap" for employees while providing employers with a tax-optimized retention tool.

---

## 1. Design System Foundation

### 1.1 Design System Choice

**Custom Design System (Tailwind CSS based)**
We will build a lightweight, custom design system using Tailwind CSS. This allows for rapid development while maintaining a unique brand identity that doesn't look like "just another Bootstrap site." It will be optimized for mobile performance (PWA focus).

---

## 2. Core User Experience

### 2.1 Defining Experience

**Persona:** "The Wise Financial Advisor & The Energetic Supportive Friend."
- **Wise:** Trustworthy, secure, transparent, guiding (Financial aspect).
- **Energetic:** Exciting, empowering, celebrating wins (Lifestyle/Perks aspect).

**Emotional Goal:**
- **Primary:** Empowerment (I am in control of my money).
- **Secondary:** Excitement (I am getting great value/deals).

### 2.2 Novel UX Patterns

- **"Trust Shield" Micro-interactions:** Subtle animations when escrow is active (e.g., a shield icon pulsing gently) to reinforce safety without inducing fear.
- **"Tax Savings" Gamification:** Visual progress bars for employers showing cumulative tax saved, turning a boring compliance metric into a "high score."
- **"Deal Drop" Energy:** High-energy visual treatment for limited-time offers (vibrant colors, countdowns) to contrast with the calm "Wallet" section.

---

## 3. Visual Foundation

### 3.1 Color System (Proposed)

**Concept: "Trust Meets Energy"**
A dual-personality palette that balances the stability of fintech with the vibrancy of a lifestyle marketplace.

- **Primary (The Wise Advisor):** **Electric Royal Blue** (`#2563EB`)
  - *Usage:* Headers, Primary Navigation, Trust Badges, Wallet Balance.
  - *Vibe:* Trustworthy, Established, "Big Tech" Finance (Standard but energetic).

- **Secondary (The Energetic Friend):** **Vibrant Coral** (`#FA7921`)
  - *Usage:* CTAs (Buy, Save), Deal Highlights, Success States.
  - *Vibe:* Warm, Energetic, Urgent, "African Sun" energy.

- **Accent/Action:** **Electric Lime** (`#96E072`)
  - *Usage:* "Savings" indicators, Positive trends, Success checks.
  - *Vibe:* Fresh, Growth, Money.

- **Neutral/Background:** **Clean White** (`#FFFFFF`) & **Soft Light Grey** (`#F8F9FA`)
  - *Usage:* Backgrounds, Cards.
  - *Vibe:* Modern, Airy, clutter-free (similar to Zalora/Noon).

### 3.2 Typography (Proposed)

- **Headings:** **"Outfit"** (Google Font)
  - *Style:* Geometric, modern, slightly friendly.
  - *Usage:* Page titles, Section headers, Deal prices.
  - *Why:* It has character and energy, fitting the "Supportive Friend" persona.

- **Body:** **"Inter"** (Google Font)
  - *Style:* Clean, highly legible, neutral.
  - *Usage:* UI text, descriptions, legal text.
  - *Why:* Standard for high-readability interfaces, fits the "Wise Advisor" clarity.

---

## 4. Design Direction

### 4.1 Chosen Design Approach

**"Trust Meets Energy" (Approved)**
The design balances the security of a financial platform with the excitement of a lifestyle marketplace.
- **Visual Style:** Clean, card-based UI with generous whitespace (Glassmorphism accents).
- **Key Characteristic:** High-contrast "Action" zones (Deals) vs. Calm "Status" zones (Wallet).
- **Imagery:** High-quality product images for deals; Abstract geometric shapes for backgrounds.

---

## 5. User Journey Flows

### 5.1 Critical User Paths

**Flow 1: The "Trust" Moment (Escrow Purchase)**
1.  **Discovery:** User finds a deal from an "Emerging Brand" (New Merchant).
2.  **Validation:** User sees "Escrow Protected" badge and "Verified" checkmark.
3.  **Action:** User clicks "Get Voucher" -> Selects Payment Method.
4.  **Confirmation:** Payment successful -> "Funds Held in Escrow" shield animation appears.
5.  **Completion:** User receives service -> Clicks "Confirm Delivery" -> Funds released to merchant.

**Flow 2: The "Benefit" Moment (Stipend Usage)**
1.  **Trigger:** Push notification: "Your ₦45k Monthly Stipend has arrived!"
2.  **Check:** User opens app -> Wallet Card shows updated balance with "+12%" indicator.
3.  **Spend:** User browses "Stipend Eligible" category (Food/Transport).
4.  **Redeem:** Selects deal -> "Pay with Stipend Wallet" -> Instant confirmation.

---

## 6. Component Library

### 6.1 Component Strategy

**Atomic Design Approach**
-   **Atoms:**
    -   **Buttons:** Primary (Royal Blue), Secondary (Coral), Ghost (Text).
    -   **Badges:** Trust (Green/Shield), Discount (Coral/Tag), Status (Grey/Pill).
    -   **Typography:** Headings (Outfit), Body (Inter).
-   **Molecules:**
    -   **Deal Card:** Image + Title + Price + Badges + CTA.
    -   **Wallet Widget:** Balance + Trend + Quick Actions.
    -   **Search Bar:** Input + Filter Icon.
-   **Organisms:**
    -   **Global Header:** User Profile + Wallet Widget.
    -   **Bottom Nav:** Home, Explore, Wallet, Profile.
    -   **Deal Feed:** Horizontal Scroll Categories + Vertical Deal List.

### 6.2 Global Components

**Offline Banner**
-   **Function:** Global notification appearing at the very top of the viewport when network connectivity is lost.
-   **Positioning:** Fixed (`top-0`, `z-50`).
-   **Layout Constraint:** All other fixed-position elements (e.g., sticky headers, sidebars) MUST account for the potential presence of this banner.
    -   *Recommendation:* Use a CSS variable (e.g., `--offline-banner-height`) or ensure `top` offsets for other fixed elements can dynamically adjust or sit below the banner's z-index if overlapping is acceptable (though pushing content is preferred).
-   **Behavior:** Auto-hides when online.

---

## 7. UX Pattern Decisions

### 7.1 Consistency Rules

-   **Trust Shield:** ALWAYS appear on transactions involving "Emerging Brands."
-   **Currency Formatting:** ALWAYS display Naira with commas (e.g., ₦12,500) and no decimals for whole numbers.
-   **Feedback Loop:** Every action (Click, Pay, Save) must have immediate visual feedback (Ripple, Toast, or Page Transition).
-   **Empty States:** Never say "No results." Say "No deals found in this category yet. Try 'Food'?"

---

## 8. Responsive Design & Accessibility

### 8.1 Responsive Strategy

**Mobile-First PWA**
-   **Touch Targets:** Minimum 44x44px for all interactive elements.
-   **Navigation:** Bottom bar for primary navigation (thumb zone friendly).
-   **Font Sizes:** Minimum 14px for body text to ensure readability on small screens.
-   **Dark Mode:** System-preference aware (Future phase, built into Tailwind config).

---

## 9. Implementation Guidance

### 9.1 Completion Summary

The UX Design phase is complete. We have defined the persona, visual foundation, and key user flows. The "Trust Meets Energy" direction is approved and ready for high-fidelity wireframing or direct implementation.

**Next Steps:**
1.  **Frontend Setup:** Initialize Next.js project with Tailwind CSS.
2.  **Theme Config:** Configure `tailwind.config.js` with the approved color palette and fonts.
3.  **Component Build:** Build core atoms (Buttons, Cards) first.

---

## Appendix

### Related Documents

- Product Requirements: `docs/prd.md`
- Product Brief: `docs/product-brief-perks-app-2025-11-20.md`
- Brainstorming: `docs/brainstorming-session-results-2025-11-20.md`
