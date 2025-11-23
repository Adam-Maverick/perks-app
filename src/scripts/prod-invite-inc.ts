import { config } from "dotenv";
import path from "path";
import fs from "fs";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
    config({ path: envPath });
}

async function seed() {
    const { db } = await import("@/db");
    const { invitations, organizations } = await import("@/db/schema");

    console.log("Creating PROD invitation code for Test Company Inc...");

    const orgs = await db.query.organizations.findMany();
    const orgInc = orgs.find(org => org.name === "Test Company Inc");

    if (!orgInc) {
        console.error("Error: Test Company Inc not found.");
        process.exit(1);
    }

    const code = "PROD-INC-" + Math.floor(Math.random() * 10000);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(invitations).values({
        code: code,
        employerId: orgInc.id,
        expiresAt: expiresAt,
    });

    console.log("\n✅ PROD Invitation Code Created!");
    console.log("--------------------------------");
    console.log(`Organization: ${orgInc.name}`);
    console.log(`Code:         ${code}`);
    console.log("--------------------------------");

    process.exit(0);
}

seed().catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
});
