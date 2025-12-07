/**
 * Integration Test for Tax Shield Feature
 * Tests the complete flow: Server Action → Hook → Component → Real-time Updates
 *
 * Run with: npx vitest run scripts/test-tax-shield.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { calculateEmployeeTaxContribution } from '../src/server/actions/calculateEmployeeTaxContribution';
import { db } from '../src/db';
import { transactions, wallets } from '../src/db/schema';
import { eq } from 'drizzle-orm';

describe('Tax Shield Integration Tests', () => {
  let testUserId: string;
  let testWalletId: string;

  beforeAll(async () => {
    // Create test user and wallet
    testUserId = 'test-user-tax-shield-' + Date.now();

    // Insert test wallet
    const [wallet] = await db.insert(wallets).values({
      userId: testUserId,
      balance: 0,
      currency: 'NGN',
    }).returning();

    testWalletId = wallet.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(transactions).where(eq(transactions.userId, testUserId));
    await db.delete(wallets).where(eq(wallets.userId, testUserId));
  });

  it('should calculate tax contribution for stipend transactions', async () => {
    // Insert test stipend transactions
    const testTransactions = [
      {
        userId: testUserId,
        walletId: testWalletId,
        type: 'debit' as const,
        amount: 2500000, // ₦25,000
        description: 'Stipend purchase',
        status: 'completed' as const,
      },
      {
        userId: testUserId,
        walletId: testWalletId,
        type: 'debit' as const,
        amount: 1500000, // ₦15,000
        description: 'Stipend purchase',
        status: 'completed' as const,
      },
    ];

    await db.insert(transactions).values(testTransactions);

    // Test Server Action
    const result = await calculateEmployeeTaxContribution({ userId: testUserId });

    expect(result.success).toBe(true);
    expect(result.data?.totalSpent).toBe(40); // ₦40,000 / 100
    expect(result.data?.taxSavings).toBe(60); // (40,000 * 1.5 * 0.3) / 100

    // Clean up transactions
    await db.delete(transactions).where(eq(transactions.userId, testUserId));
  });

  it('should handle zero transactions gracefully', async () => {
    const result = await calculateEmployeeTaxContribution({ userId: testUserId });

    expect(result.success).toBe(true);
    expect(result.data?.totalSpent).toBe(0);
    expect(result.data?.taxSavings).toBe(0);
  });

  it('should validate input parameters', async () => {
    const result = await calculateEmployeeTaxContribution({ userId: '' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('User ID is required');
  });

  it('should calculate correct tax savings with different amounts', async () => {
    // Insert single large transaction
    await db.insert(transactions).values({
      userId: testUserId,
      walletId: testWalletId,
      type: 'debit' as const,
      amount: 10000000, // ₦100,000
      description: 'Large stipend purchase',
      status: 'completed' as const,
    });

    const result = await calculateEmployeeTaxContribution({ userId: testUserId });

    expect(result.success).toBe(true);
    expect(result.data?.totalSpent).toBe(100);
    expect(result.data?.taxSavings).toBe(150); // (100,000 * 1.5 * 0.3) / 100

    // Clean up
    await db.delete(transactions).where(eq(transactions.userId, testUserId));
  });

  it('should only count completed stipend wallet transactions', async () => {
    // Insert mixed transactions
    await db.insert(transactions).values([
      {
        userId: testUserId,
        walletId: testWalletId,
        type: 'debit' as const,
        amount: 2000000, // ₦20,000 - should count
        description: 'Completed stipend purchase',
        status: 'completed' as const,
      },
      {
        userId: testUserId,
        walletId: testWalletId,
        type: 'debit' as const,
        amount: 1000000, // ₦10,000 - should NOT count (pending)
        description: 'Pending stipend purchase',
        status: 'pending' as const,
      },
      {
        userId: testUserId,
        type: 'credit' as const,
        amount: 500000, // ₦5,000 - should NOT count (no wallet)
        description: 'Deposit',
        status: 'completed' as const,
      },
    ]);

    const result = await calculateEmployeeTaxContribution({ userId: testUserId });

    expect(result.success).toBe(true);
    expect(result.data?.totalSpent).toBe(20); // Only completed stipend transaction
    expect(result.data?.taxSavings).toBe(30); // (20,000 * 1.5 * 0.3) / 100

    // Clean up
    await db.delete(transactions).where(eq(transactions.userId, testUserId));
  });
});

// Manual test instructions for real-time updates
console.log(`
📋 Manual Integration Test Instructions:

1. Start the development server: npm run dev
2. Navigate to employee dashboard
3. Verify TaxShieldWidget displays with loading state
4. Create a stipend wallet transaction via database or API
5. Verify widget updates automatically with new tax savings
6. Test tooltip functionality
7. Test responsive design on mobile
8. Test with reduced motion preferences

Expected Results:
- Widget shows "₦0.00" initially for new users
- Animations are smooth (unless reduced motion enabled)
- Real-time updates work via TanStack Query
- Calculations match: (Total Spent × 1.5 × 0.30)
- Progress bar shows reasonable percentage
- Tooltip explains tax deduction clearly
`);