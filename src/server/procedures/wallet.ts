/**
 * Wallet Procedures (Story 5.1)
 *
 * Core wallet logic for creating wallets and managing balances.
 * Implements ADR-005 Reservation Pattern support.
 */

import { db } from '@/db';
import { wallets, walletTransactions, users } from '@/db/schema';
import { eq, and, sql, gte, lt, lte } from 'drizzle-orm';
import { startOfMonth, subMonths, endOfMonth } from 'date-fns';

// Types exported for consumers
export type Wallet = typeof wallets.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;

/**
 * Create a wallet for a user.
 * Enforces 1:1 relationship - throws if wallet already exists.
 *
 * @param userId - Clerk user ID
 * @returns Created wallet
 * @throws Error if user doesn't exist or wallet already exists
 */
export async function createWallet(userId: string): Promise<Wallet> {
    // Verify user exists
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user) {
        throw new Error(`User not found: ${userId}`);
    }

    // Check if wallet already exists (defensive - unique index also enforces this)
    const existingWallet = await db.query.wallets.findFirst({
        where: eq(wallets.userId, userId),
    });

    if (existingWallet) {
        throw new Error(`Wallet already exists for user: ${userId}`);
    }

    // Create wallet with default balance of 0
    const [newWallet] = await db
        .insert(wallets)
        .values({
            userId,
            balance: 0,
            currency: 'NGN',
        })
        .returning();

    return newWallet;
}

/**
 * Get wallet by user ID.
 *
 * @param userId - Clerk user ID
 * @returns Wallet or null if not found
 */
export async function getWalletByUserId(userId: string): Promise<Wallet | null> {
    const wallet = await db.query.wallets.findFirst({
        where: eq(wallets.userId, userId),
    });

    return wallet ?? null;
}

/**
 * Get wallet balance for a user.
 * Returns the balance field directly (not calculated from transactions).
 *
 * Note: Balance field is kept in sync with transactions via atomic updates.
 * For auditing/reconciliation, use calculateBalanceFromTransactions().
 *
 * @param userId - Clerk user ID
 * @returns Balance in kobo, or 0 if no wallet
 */
export async function getWalletBalance(userId: string): Promise<number> {
    const wallet = await getWalletByUserId(userId);

    if (!wallet) {
        return 0;
    }

    return wallet.balance;
}

/**
 * Calculate wallet balance from transactions (AC: 7).
 * Used for reconciliation and verification.
 *
 * Formula: SUM(completed deposits + refunds) - SUM(completed spends)
 *
 * @param walletId - Wallet UUID
 * @returns Calculated balance in kobo
 */
export async function calculateBalanceFromTransactions(walletId: string): Promise<number> {
    // Get sum of completed deposits and refunds (credits)
    const creditsResult = await db
        .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(walletTransactions)
        .where(
            and(
                eq(walletTransactions.walletId, walletId),
                eq(walletTransactions.status, 'COMPLETED'),
                sql`type IN ('DEPOSIT', 'REFUND')`
            )
        );

    // Get sum of completed spends (debits)
    const debitsResult = await db
        .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(walletTransactions)
        .where(
            and(
                eq(walletTransactions.walletId, walletId),
                eq(walletTransactions.status, 'COMPLETED'),
                eq(walletTransactions.type, 'SPEND')
            )
        );

    const credits = Number(creditsResult[0]?.total ?? 0);
    const debits = Number(debitsResult[0]?.total ?? 0);

    return credits - debits;
}

/**
 * Get or create wallet for user.
 * Utility function that ensures a user always has a wallet.
 *
 * @param userId - Clerk user ID
 * @returns Existing or newly created wallet
 */
export async function getOrCreateWallet(userId: string): Promise<Wallet> {
    const existingWallet = await getWalletByUserId(userId);

    if (existingWallet) {
        return existingWallet;
    }

    return createWallet(userId);
}

/**
 * Update wallet balance atomically.
 * Uses SQL arithmetic to prevent race conditions (AC: Concurrency constraint).
 *
 * @param walletId - Wallet UUID
 * @param delta - Amount to add (positive) or subtract (negative)
 * @returns Updated wallet
 * @throws Error if balance would go negative
 */
export async function updateWalletBalance(
    walletId: string,
    delta: number
): Promise<Wallet> {
    // Use atomic update to prevent race conditions
    // The application-level check here supplements the DB constraint
    const [updated] = await db
        .update(wallets)
        .set({
            balance: sql`${wallets.balance} + ${delta}`,
            updatedAt: new Date(),
        })
        .where(eq(wallets.id, walletId))
        .returning();

    if (!updated) {
        throw new Error(`Wallet not found: ${walletId}`);
    }

    // Double-check balance didn't go negative
    // (DB constraint should catch this, but be defensive)
    if (updated.balance < 0) {
        throw new Error('Insufficient wallet balance');
    }

    return updated;
}

// ============================================
// WALLET STATS (Story 5.3)
// ============================================

export type WalletTrend = {
    percentage: number;
    direction: 'up' | 'down' | 'neutral';
    label: string;
};

export type WalletStats = {
    balance: number;
    trend: WalletTrend;
};

/**
 * Get wallet statistics for a user (Story 5.3 AC: 1, 2).
 * Returns balance and monthly trend based on transaction activity.
 *
 * Trend Logic (Option A - Transaction-Based):
 * - Compares total DEPOSIT transactions this month vs last month
 * - Positive % = more funding this month ("up")
 * - Negative % = less funding this month ("down")
 * - Zero/no transactions = neutral
 *
 * @param userId - Clerk user ID
 * @returns WalletStats with balance and trend
 */
export async function getWalletStats(userId: string): Promise<WalletStats> {
    const wallet = await getWalletByUserId(userId);

    if (!wallet) {
        return {
            balance: 0,
            trend: {
                percentage: 0,
                direction: 'neutral',
                label: 'No wallet yet',
            },
        };
    }

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));

    // Get total deposits this month (COMPLETED deposits only)
    const currentMonthDepositsResult = await db
        .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(walletTransactions)
        .where(
            and(
                eq(walletTransactions.walletId, wallet.id),
                eq(walletTransactions.type, 'DEPOSIT'),
                eq(walletTransactions.status, 'COMPLETED'),
                gte(walletTransactions.createdAt, currentMonthStart)
            )
        );

    // Get total deposits last month
    const previousMonthDepositsResult = await db
        .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(walletTransactions)
        .where(
            and(
                eq(walletTransactions.walletId, wallet.id),
                eq(walletTransactions.type, 'DEPOSIT'),
                eq(walletTransactions.status, 'COMPLETED'),
                gte(walletTransactions.createdAt, previousMonthStart),
                lte(walletTransactions.createdAt, previousMonthEnd)
            )
        );

    const currentMonthDeposits = Number(currentMonthDepositsResult[0]?.total ?? 0);
    const previousMonthDeposits = Number(previousMonthDepositsResult[0]?.total ?? 0);

    // Calculate trend
    let trend: WalletTrend;

    if (previousMonthDeposits === 0 && currentMonthDeposits === 0) {
        trend = {
            percentage: 0,
            direction: 'neutral',
            label: 'No funding activity',
        };
    } else if (previousMonthDeposits === 0) {
        // First month with deposits
        trend = {
            percentage: 100,
            direction: 'up',
            label: 'First funding this month!',
        };
    } else {
        const percentageChange = Math.round(
            ((currentMonthDeposits - previousMonthDeposits) / previousMonthDeposits) * 100
        );

        if (percentageChange > 0) {
            trend = {
                percentage: percentageChange,
                direction: 'up',
                label: `+${percentageChange}% this month`,
            };
        } else if (percentageChange < 0) {
            trend = {
                percentage: Math.abs(percentageChange),
                direction: 'down',
                label: `${percentageChange}% this month`,
            };
        } else {
            trend = {
                percentage: 0,
                direction: 'neutral',
                label: 'Same as last month',
            };
        }
    }

    return {
        balance: wallet.balance,
        trend,
    };
}
