# Story 5.3 Implementation Plan: Wallet Balance Display

## Goal Description
Implement the Wallet Balance Data Procedures, Real-time Data Fetching hook, and the Wallet Widget UI for the Employee Dashboard as per details in Story 5.3.

## Proposed Changes

### Backend (Server Procedures)
#### [MODIFY] [wallet.ts](file:///c:/User/USER/perks-app/src/server/procedures/wallet.ts)
- Add `getWalletStats(userId)` procedure.
  - Returns `{ balance: number, trend: { percentage: number, direction: 'up' | 'down' | 'neutral', label: string } }`.
- Implement trend calculation logic:
  - Fetch transactions for current month vs previous month.
  - Or simply compare current balance vs balance at start of month.
  - *Ref*: Story 5.3 AC2.

### Frontend (Hooks)
#### [NEW] [use-wallet.ts](file:///c:/User/USER/perks-app/src/hooks/queries/use-wallet.ts)
- Implement `useWalletStats` hook using TanStack Query.
- Should use `getWalletStats` as the query function.
- Query Key: `['wallet-stats', userId]`.

### Frontend (Components)
#### [NEW] [WalletWidget.tsx](file:///c:/User/USER/perks-app/src/components/modules/wallet/WalletWidget.tsx)
- Create `WalletWidget` component.
- Use `useWalletStats` hook.
- Render:
  - Balance in Naira (using `Intl.NumberFormat`).
  - Trend indicator (Green for positive, Red for negative/low, Neutral).
  - "Low Balance" alert if < 1000.
  - Link to `/dashboard/employee/wallet/history`.
- Styling: Electric Royal Blue theme, Skeleton loader.

### Testing
#### [MODIFY] [wallet.test.ts](file:///c:/User/USER/perks-app/src/server/procedures/__tests__/wallet.test.ts)
- Add tests for `getWalletStats`.
  - Test calculation with no transactions.
  - Test calculation with transactions in current/prev months.

#### [NEW] [WalletWidget.test.tsx](file:///c:/User/USER/perks-app/src/components/modules/wallet/__tests__/WalletWidget.test.tsx)
- Add component tests using Testing Library.
  - Render provided balance.
  - Render low balance warning.
  - Verify link attribute.

## Verification Plan

### Automated Tests
- Run `npx vitest src/server/procedures/__tests__/wallet.test.ts`
- Run `npx vitest src/components/modules/wallet/__tests__/WalletWidget.test.tsx`

### Manual Verification
1.  **Dashboard Check**: Log in as Employee. Verify Wallet Widget appears on Dashboard.
2.  **Balance Check**: Verify displayed balance matches DB.
3.  **Real-time Update**: Trigger a transaction (if possible via separate tab/admin) and verify widget updates (may require `invalidateQueries` usage later, confirming hook setup).
4.  **Low Balance**: Temporarily set balance < 1000 in DB and verify alert.
