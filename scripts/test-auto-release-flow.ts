import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { eq, and, lt } from 'drizzle-orm';

// Load environment variables BEFORE importing app code
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
}

async function runTest() {
    console.log('🚀 Starting Auto-Release Flow Test...\n');

    // Dynamic imports
    const schema = await import('../src/db/schema');
    const { transitionState } = await import('../src/lib/escrow-state-machine');

    // Mock releaseFundsToMerchant to avoid actual Paystack call and dependency issues
    // We just want to test the query and state transition logic here
    const releaseFundsToMerchant = async (holdId: string) => {
        console.log(`[MOCK] Releasing funds for hold ${holdId}`);
        return { success: true };
    };

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    try {
        // 1. Setup Data
        // Find a merchant
        const merchant = await db.query.merchants.findFirst();
        if (!merchant) throw new Error('No merchants found');

        // Find or Create User
        let user = await db.query.users.findFirst();
        if (!user) {
            const [newUser] = await db.insert(schema.users).values({
                id: `user_${Date.now()}`,
                email: 'test-auto@example.com',
                firstName: 'Test',
                lastName: 'Auto',
            }).returning();
            user = newUser;
        }

        // Create Transaction
        const [transaction] = await db.insert(schema.transactions).values({
            userId: user.id,
            type: 'debit',
            amount: 500000,
            description: 'Test Auto-Release Transaction',
            status: 'pending',
            reference: `REF-AUTO-${Date.now()}`,
            merchantId: merchant.id, // Needed for auto-release email
        }).returning();

        // Create OLD Escrow Hold (15 days ago)
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

        const [hold] = await db.insert(schema.escrowHolds).values({
            transactionId: transaction.id,
            merchantId: merchant.id,
            amount: 500000,
            state: 'HELD',
            heldAt: fifteenDaysAgo, // Backdate this
        }).returning();

        console.log(`✅ Created Old Escrow Hold: ${hold.id} (Held At: ${fifteenDaysAgo.toISOString()})`);

        // 2. Simulate Auto-Release Query
        console.log('\n--- Simulating Auto-Release Query ---');
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const eligibleHolds = await db.query.escrowHolds.findMany({
            where: and(
                eq(schema.escrowHolds.state, "HELD"),
                lt(schema.escrowHolds.heldAt, fourteenDaysAgo)
            ),
            with: {
                transaction: {
                    with: {
                        user: true,
                        merchant: true,
                    },
                },
            },
        });

        console.log(`Found ${eligibleHolds.length} eligible holds.`);
        const foundHold = eligibleHolds.find(h => h.id === hold.id);

        if (foundHold) {
            console.log('✅ Correctly identified the 15-day old hold.');

            // 3. Simulate Processing
            console.log('\n--- Simulating Processing ---');

            // Transition State
            const transitionResult = await transitionState(
                foundHold.id,
                "RELEASED",
                "SYSTEM",
                "Auto-release after 14 days"
            );

            if (transitionResult.success) {
                console.log('✅ State Transition Successful');

                // Mock Transfer
                const transferResult = await releaseFundsToMerchant(foundHold.id);

                if (transferResult.success) {
                    console.log('✅ Transfer Successful (Mocked)');

                    // Update Transaction Status
                    await db.update(schema.transactions)
                        .set({ status: 'auto_completed' })
                        .where(eq(schema.transactions.id, foundHold.transactionId));
                    console.log('✅ Transaction Status Updated to auto_completed');
                }
            } else {
                console.error('❌ State Transition Failed:', transitionResult.error);
            }

        } else {
            console.error('❌ Failed to identify the 15-day old hold.');
        }

        // 4. Verify Final State
        console.log('\n--- Verifying Final State ---');
        const finalHold = await db.query.escrowHolds.findFirst({
            where: eq(schema.escrowHolds.id, hold.id)
        });
        const finalTx = await db.query.transactions.findFirst({
            where: eq(schema.transactions.id, transaction.id)
        });

        console.log(`Final Hold State: ${finalHold?.state}`);
        console.log(`Final Transaction Status: ${finalTx?.status}`);

        if (finalHold?.state === 'RELEASED' && finalTx?.status === 'auto_completed') {
            console.log('🎉 Test PASSED: Auto-release flow verified.');
        } else {
            console.error('❌ Test FAILED: Final state incorrect.');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        await pool.end();
    }
}

runTest();
