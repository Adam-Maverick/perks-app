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
    const { employees, users, organizations } = await import("@/db/schema");

    console.log("Setting up employee record for current user...");

    // Prompt for user ID
    const readline = await import("readline");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (query: string): Promise<string> => new Promise((resolve) => rl.question(query, resolve));

    try {
        const userId = await question("Enter your Clerk User ID (from Clerk dashboard or browser console): ");
        const userEmail = await question("Enter your email: ");

        if (!userId || !userEmail) {
            console.error("User ID and email are required!");
            process.exit(1);
        }

        // Get the first organization (or create one)
        let org = await db.query.organizations.findFirst();

        if (!org) {
            console.log("No organization found. Creating a test organization...");
            const insertResult = await db.insert(organizations).values({
                id: "org_test_" + Date.now(),
                name: "Test Organization A",
                slug: "test-org-a",
            }).returning();
            org = insertResult[0];
            console.log("Created organization:", org.name);
        }

        // Check if user exists
        let user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, userId)
        });

        if (!user) {
            console.log("User not found in database. Creating user record...");
            const insertResult = await db.insert(users).values({
                id: userId,
                email: userEmail,
            }).returning();
            user = insertResult[0];
            console.log("Created user record");
        }

        // Check if employee record exists
        const existingEmployee = await db.query.employees.findFirst({
            where: (employees, { eq }) => eq(employees.userId, userId)
        });

        if (existingEmployee) {
            console.log("\\n✅ Employee record already exists!");
            console.log("--------------------------------");
            console.log(`User ID:      ${userId}`);
            console.log(`Email:        ${existingEmployee.email}`);
            console.log(`Organization: ${org.name}`);
            console.log(`Status:       ${existingEmployee.status}`);
            console.log("--------------------------------");
        } else {
            // Create employee record
            await db.insert(employees).values({
                userId: userId,
                organizationId: org.id,
                email: userEmail,
                status: "active",
                joinedAt: new Date(),
            });

            console.log("\\n✅ Employee Record Created!");
            console.log("--------------------------------");
            console.log(`User ID:      ${userId}`);
            console.log(`Email:        ${userEmail}`);
            console.log(`Organization: ${org.name}`);
            console.log("--------------------------------");
            console.log("You can now test the transfer functionality!");
        }
    } finally {
        rl.close();
    }

    process.exit(0);
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
