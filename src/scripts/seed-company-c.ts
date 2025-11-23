import { config } from "dotenv";
import path from "path";
import fs from "fs";

const envPath = path.resolve(process.cwd(), ".env.local");
console.log("Loading env from:", envPath);
if (fs.existsSync(envPath)) {
    config({ path: envPath });
} else {
    console.error("Error: .env.local file not found at", envPath);
}

async function seed() {
    // Dynamic import to ensure env vars are loaded first
    const { db } = await import("@/db");
    const { invitations, organizations } = await import("@/db/schema");

    console.log("Creating Test Company C...");

    // Check if Test Company C already exists
    const orgs = await db.query.organizations.findMany();
    let orgC = orgs.find(org => org.name === "Test Company C");

    if (!orgC) {
        const insertResult = await db.insert(organizations).values({
            id: "org_test_c_" + Date.now(),
            name: "Test Company C",
            slug: "test-company-c",
        }).returning();
        orgC = insertResult[0];
        console.log("✅ Created Test Company C");
    } else {
        console.log("ℹ️  Test Company C already exists");
    }

    // Create invitation code
    const code = "TRANSFER-TO-C-" + Math.floor(Math.random() * 10000);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(invitations).values({
        code: code,
        employerId: orgC.id,
        expiresAt: expiresAt,
    });

    console.log("\n✅ Test Invitation Created!");
    console.log("--------------------------------");
    console.log(`Target Organization: ${orgC.name}`);
    console.log(`Invitation Code:     ${code}`);
    console.log("--------------------------------");
    console.log("Use this code to transfer to Test Company C");

    process.exit(0);
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
