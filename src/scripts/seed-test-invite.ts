
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

    console.log("Seeding test invitation...");

    // Get the first organization
    const orgs = await db.query.organizations.findMany({ limit: 2 });

    if (orgs.length === 0) {
        console.error("No organizations found. Please create an organization in Clerk first.");
        process.exit(1);
    }

    const targetOrg = orgs[0];
    const code = "TEST-TRANSFER-" + Math.floor(Math.random() * 10000);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(invitations).values({
        code: code,
        employerId: targetOrg.id,
        expiresAt: expiresAt,
    });

    console.log("\n✅ Test Invitation Created!");
    console.log("--------------------------------");
    console.log(`Organization: ${targetOrg.name}`);
    console.log(`Code:         ${code}`);
    console.log("--------------------------------");
    console.log("Use this code to test the transfer functionality.");

    process.exit(0);
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
