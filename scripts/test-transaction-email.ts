import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { sendConfirmationEmails } from "@/server/actions/notifications";

async function testTransactionEmail() {
    console.log("📧 Testing transaction email sending...");

    // 1. Find a transaction for the test user
    const userId = "user_35p4B9JJjSKeexSSI3vhN7aNAHm";
    const transaction = await db.query.transactions.findFirst({
        where: (transactions, { eq }) => eq(transactions.userId, userId),
        with: { user: true, merchant: true }
    });

    if (!transaction) {
        console.error("❌ No transaction found. Run seed script first.");
        process.exit(1);
    }

    console.log(`📦 Using transaction: ${transaction.id}`);
    console.log(`👤 User Email: ${transaction.user.email}`);

    // 2. Send emails
    const result = await sendConfirmationEmails(transaction.id);

    if (result.success) {
        console.log("✅ Email sending function returned success");
    } else {
        console.error("❌ Email sending failed:", result.error);
    }

    process.exit(0);
}

testTransactionEmail();
