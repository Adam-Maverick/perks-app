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

    console.log("Creating invitation code for Test Company B...");

    // Find Test Company B
    const orgs = await db.query.organizations.findMany();
    const orgB = orgs.find(org => org.name === "Test Company B");

    if (!orgB) {
        console.error("Error: Test Company B not found. Please run setup-adam.ts first.");
        process.exit(1);
    }

    const code = "TRANSFER-TO-B-" + Math.floor(Math.random() * 10000);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(invitations).values({
        code: code,
        employerId: orgB.id,
        expiresAt: expiresAt,
    });

    console.log("\\n✅ Test Invitation Created!");
    console.log("--------------------------------");
    console.log(`Target Organization: ${orgB.name}`);
    console.log(`Invitation Code:     ${code}`);
    console.log("--------------------------------");
    console.log("Use this code to transfer from Test Company Inc to Test Company B");

    process.exit(0);
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
