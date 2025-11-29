import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function verifyUserEmail() {
    const userId = "user_35p4B9JJjSKeexSSI3vhN7aNAHm";

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user) {
        console.log("❌ User not found in database!");
        console.log("💡 The user needs to be created in the database first.");
        process.exit(1);
    }

    console.log("✅ User found:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email || "(no email set)"}`);
    console.log(`   First Name: ${user.firstName || "(not set)"}`);
    console.log(`   Last Name: ${user.lastName || "(not set)"}`);

    if (!user.email) {
        console.log("\n⚠️  WARNING: User has no email address!");
        console.log("   Emails will NOT be sent during confirmation.");
    } else if (user.email !== "adamsky737@gmail.com") {
        console.log(`\n⚠️  WARNING: Email mismatch!`);
        console.log(`   Expected: adamsky737@gmail.com`);
        console.log(`   Actual: ${user.email}`);
    } else {
        console.log("\n✅ Email is correctly set to adamsky737@gmail.com");
    }

    process.exit(0);
}

verifyUserEmail();
