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

    console.log("Creating invitation code for Test Company Inc...");

    // Find Test Company Inc
    const orgs = await db.query.organizations.findMany();
    const orgA = orgs.find(org => org.name === "Test Company Inc");

    if (!orgA) {
        console.error("Error: Test Company Inc not found.");
        process.exit(1);
    }

    const code = "TRANSFER-TO-A-" + Math.floor(Math.random() * 10000);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(invitations).values({
        code: code,
        employerId: orgA.id,
        expiresAt: expiresAt,
    });

    console.log("\\n✅ Test Invitation Created!");
    console.log("--------------------------------");
    console.log(`Target Organization: ${orgA.name}`);
    console.log(`Invitation Code:     ${code}`);
    console.log("--------------------------------");
    console.log("Use this code to transfer from Test Company B to Test Company Inc");

    process.exit(0);
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
