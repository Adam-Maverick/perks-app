import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "@/db";
import { transactions, escrowHolds, deals, merchants } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Seed script to create test transactions with escrow holds
 * Run with: npx tsx scripts/seed-test-transactions.ts
 */

async function seedTestTransactions() {
    console.log("🌱 Seeding test transactions...");

    try {
        // 1. Get the current user ID from Clerk
        // Hardcoded for testing
        const userId = "user_35p4B9JJjSKeexSSI3vhN7aNAHm";

        if (!userId) {
            console.error("❌ Error: TEST_USER_ID environment variable not set");
            console.log("💡 Set it with: export TEST_USER_ID='your-clerk-user-id'");
            process.exit(1);
        }

        // 2. Get a merchant and deal from the database
        const merchant = await db.query.merchants.findFirst();
        if (!merchant) {
            console.error("❌ Error: No merchants found. Run seed script first.");
            process.exit(1);
        }

        const deal = await db.query.deals.findFirst({
            where: eq(deals.merchantId, merchant.id),
        });

        if (!deal) {
            console.error("❌ Error: No deals found for merchant.");
            process.exit(1);
        }

        console.log(`📦 Using merchant: ${merchant.name}`);
        console.log(`🎁 Using deal: ${deal.title}`);

        // 3. Create test transactions with escrow holds
        const testTransactions = [
            {
                amount: 50000, // ₦500
                description: `Purchase: ${deal.title}`,
                state: "HELD" as const,
            },
            {
                amount: 120000, // ₦1,200
                description: `Purchase: Premium Package`,
                state: "HELD" as const,
            },
            {
                amount: 75000, // ₦750
                description: `Purchase: ${deal.title} (Released)`,
                state: "RELEASED" as const,
            },
        ];

        for (const testTxn of testTransactions) {
            // Create transaction
            const [txn] = await db.insert(transactions).values({
                userId,
                dealId: deal.id,
                merchantId: merchant.id,
                amount: testTxn.amount,
                type: "debit",
                status: "completed",
                paystackReference: `test_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                description: testTxn.description,
            }).returning();

            console.log(`✅ Created transaction: ${txn.id} (${testTxn.description})`);

            // Create escrow hold
            const [hold] = await db.insert(escrowHolds).values({
                transactionId: txn.id,
                merchantId: merchant.id,
                amount: testTxn.amount,
                state: testTxn.state,
                heldAt: new Date(),
                releasedAt: testTxn.state === "RELEASED" ? new Date() : null,
            }).returning();

            // Link escrow hold to transaction
            await db.update(transactions)
                .set({ escrowHoldId: hold.id })
                .where(eq(transactions.id, txn.id));

            console.log(`   🔒 Created escrow hold: ${hold.id} (${testTxn.state})`);
        }

        console.log("\n✨ Test transactions seeded successfully!");
        console.log(`📍 View at: http://localhost:3000/employee/transactions`);

    } catch (error) {
        console.error("❌ Error seeding test transactions:", error);
        process.exit(1);
    }

    process.exit(0);
}

seedTestTransactions();
