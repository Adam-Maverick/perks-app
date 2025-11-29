import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
import { db } from "@/db";
import { users, merchants } from "@/db/schema";
import { eq } from "drizzle-orm";

async function fixEmails() {
    console.log("🔧 Fixing emails for testing...");

    // 1. Update User Email
    const userId = "user_35p4B9JJjSKeexSSI3vhN7aNAHm";
    const verifiedEmail = "akangbeadam@gmail.com";

    await db.update(users)
        .set({ email: verifiedEmail })
        .where(eq(users.id, userId));

    console.log(`✅ Updated user ${userId} email to ${verifiedEmail}`);

    // 2. Update Merchant Email
    const testEmail = "delivered@resend.dev";
    const merchant = await db.query.merchants.findFirst();

    if (merchant) {
        const contactInfo = merchant.contactInfo ? JSON.parse(merchant.contactInfo) : {};
        contactInfo.email = testEmail;

        await db.update(merchants)
            .set({ contactInfo: JSON.stringify(contactInfo) })
            .where(eq(merchants.id, merchant.id));

        console.log(`✅ Updated merchant ${merchant.name} email to ${testEmail}`);
    } else {
        console.log("⚠️ No merchant found to update");
    }

    process.exit(0);
}

fixEmails();
