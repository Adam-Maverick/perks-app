import { db } from '@/db';
import { disputes, transactions, users, escrowHolds } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

const FRAUD_THRESHOLD = 0.15; // 15% dispute rate

/**
 * Calculate dispute rate for a user and flag if exceeds threshold
 * AC#6: Flag users with >15% dispute rate
 */
export async function calculateDisputeRate(userId: string): Promise<void> {
    try {
        // 1. Get total transactions for user
        const totalTransactions = await db
            .select({ count: count() })
            .from(transactions)
            .where(eq(transactions.userId, userId));

        const total = totalTransactions[0]?.count || 0;

        if (total === 0) {
            return; // No transactions, nothing to flag
        }

        // 2. Get total disputes for user
        const userDisputes = await db
            .select({ count: count() })
            .from(disputes)
            .innerJoin(escrowHolds, eq(disputes.escrowHoldId, escrowHolds.id))
            .innerJoin(transactions, eq(escrowHolds.transactionId, transactions.id))
            .where(eq(transactions.userId, userId));

        const disputeCount = userDisputes[0]?.count || 0;

        // 3. Calculate rate
        const disputeRate = disputeCount / total;

        // 4. Flag user if rate exceeds threshold
        if (disputeRate > FRAUD_THRESHOLD) {
            await db
                .update(users)
                .set({ isFlagged: true })
                .where(eq(users.id, userId));

            console.warn(`User ${userId} flagged for high dispute rate: ${(disputeRate * 100).toFixed(2)}%`);
        }
    } catch (error) {
        console.error('Error calculating dispute rate:', error);
        // Don't throw - this is a background check
    }
}
