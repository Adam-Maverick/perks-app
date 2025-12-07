
import { db } from "@/db";
import { wallets, transactions, users, organizations } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// --- Mocks ---
const MOCK_PAYSTACK = {
    chargeCard: async (amount: number, shouldFail = false) => {
        console.log(`[Paystack] Charging card: ₦${amount / 100}...`);
        await new Promise(r => setTimeout(r, 500)); // Latency simulation
        if (shouldFail) {
            console.error(`[Paystack] Charge DECLINED.`);
            throw new Error("Card Declined");
        }
        console.log(`[Paystack] Charge SUCCESS.`);
        return { references: `ref_${Date.now()}` };
    }
};

// --- Logic ---

/**
 * 1. RESERVE: Deduct from wallet (logically), creates PENDING transaction.
 * NOTE: In a real app, 'balance' in wallet might be updated immediately OR 
 * calculated as (balance - sum(pending_debits)). 
 * For this PoC, we assume we update balance BUT map it to a PENDING transaction.
 * If rollback happens, we credit it back.
 * 
 * BETTER PATTERN: "Holds" like banking. 
 * Real Balance = Ledger Balance - Holds.
 * 
 * For simplicity here: 
 * We insert a 'pending' debit. 
 * Constraints: We must ensure user has funds.
 */
async function reserveWalletFunds(userId: string, amount: number) {
    console.log(`[Wallet] Attempting to reserve ₦${amount / 100} for user ${userId}...`);

    return await db.transaction(async (tx) => {
        // Lock wallet row?
        // simple check for now
        const wallet = await tx.query.wallets.findFirst({
            where: eq(wallets.userId, userId)
        });

        if (!wallet) throw new Error("Wallet not found");
        if (wallet.balance < amount) throw new Error("Insufficient funds");

        // Create Pending Transaction
        const [reservation] = await tx.insert(transactions).values({
            userId,
            walletId: wallet.id,
            type: 'debit',
            amount: amount,
            description: 'Split Payment Reservation',
            status: 'pending',
            reference: `res_${Date.now()}`
        }).returning();

        // DECREMENT Balance immediately? 
        // Or keep it there but rely on 'pending' check?
        // Standard approach: Decrement immediately (pessimistic) so they can't double spend.
        await tx.update(wallets)
            .set({ balance: sql`${wallets.balance} - ${amount}` })
            .where(eq(wallets.id, wallet.id));

        console.log(`[Wallet] Reserved ₦${amount / 100}. Reservation ID: ${reservation.id}`);
        return reservation;
    });
}

async function commitWalletFunds(reservationId: string) {
    console.log(`[Wallet] Committing reservation ${reservationId}...`);
    await db.update(transactions)
        .set({ status: 'completed' })
        .where(eq(transactions.id, reservationId));
    console.log(`[Wallet] Reservation COMMITTED.`);
}

async function rollbackWalletFunds(reservationId: string, amount: number) {
    console.error(`[Wallet] Rolling back reservation ${reservationId}...`);

    await db.transaction(async (tx) => {
        // 1. Mark transaction as failed
        await tx.update(transactions)
            .set({ status: 'failed' })
            .where(eq(transactions.id, reservationId));

        // 2. Refund the balance
        // We need to find the wallet again. 
        // In real code, we'd join or fetch.
        const txn = await tx.query.transactions.findFirst({
            where: eq(transactions.id, reservationId)
        });
        if (!txn || !txn.walletId) return;

        await tx.update(wallets)
            .set({ balance: sql`${wallets.balance} + ${amount}` })
            .where(eq(wallets.id, txn.walletId));

        console.log(`[Wallet] funds REFUNDED to wallet.`);
    });
}

async function processSplitPayment(userId: string, totalAmount: number, walletAmount: number, cardAmount: number, simulateFailure = false) {
    console.log(`\n--- Processing Split Payment: Total ₦${totalAmount / 100} (Wallet: ₦${walletAmount / 100}, Card: ₦${cardAmount / 100}) ---`);

    let reservation = null;

    try {
        // Step 1: Reserve Wallet Funds
        if (walletAmount > 0) {
            reservation = await reserveWalletFunds(userId, walletAmount);
        }

        // Step 2: Charge Card (External API)
        if (cardAmount > 0) {
            await MOCK_PAYSTACK.chargeCard(cardAmount, simulateFailure);
        }

        // Step 3: Commit (If we get here, Card was successful)
        if (reservation) {
            await commitWalletFunds(reservation.id);
        }
        console.log(`✅ Transaction Success!`);

    } catch (error) {
        console.error(`❌ Transaction Failed: ${(error as Error).message}`);

        // Step 4: Rollback
        if (reservation) {
            await rollbackWalletFunds(reservation.id, walletAmount);
        }
    }
}

// --- Scenarios ---

async function main() {
    // Setup: Get a user and ensure they have a wallet with funds
    // Note: This relies on existing DB data. 
    // If no wallet exists, script might fail or we should seed it.

    // Check if any wallet exists, if not create one for the first user
    let wallet = await db.query.wallets.findFirst();
    if (!wallet) {
        let user = await db.query.users.findFirst();
        if (!user) { console.log('No user found'); return; }

        await db.insert(wallets).values({
            userId: user.id,
            balance: 500000 // 5000 NGN
        });
        wallet = await db.query.wallets.findFirst();
    }

    if (!wallet) return;

    const USER_ID = wallet.userId;

    // Scenario 1: Success
    await processSplitPayment(USER_ID, 10000, 2000, 8000, false);

    // Scenario 2: Card Failure
    await processSplitPayment(USER_ID, 10000, 2000, 8000, true);

    process.exit(0);
}

main().catch(console.error);
