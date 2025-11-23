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
    const { eq } = await import("drizzle-orm");

    console.log("Setting up employee record for Adam Sky...");

    const userId = "user_35p4B9JJjSKeexSSI3vhN7aNAHm";
    const userEmail = "adamsky737@gmail.com";

    // Get or create organizations
    const orgs = await db.query.organizations.findMany({ limit: 2 });

    let orgA, orgB;

    if (orgs.length === 0) {
        console.log("No organizations found. Creating two test organizations...");
        const [insertA, insertB] = await Promise.all([
            db.insert(organizations).values({
                id: "org_test_a_" + Date.now(),
                name: "Test Company A",
                slug: "test-company-a",
            }).returning(),
            db.insert(organizations).values({
                id: "org_test_b_" + Date.now() + 1,
                name: "Test Company B",
                slug: "test-company-b",
            }).returning()
        ]);
        orgA = insertA[0];
        orgB = insertB[0];
        console.log("Created organizations:", orgA.name, "and", orgB.name);
    } else if (orgs.length === 1) {
        orgA = orgs[0];
        console.log("Creating second test organization...");
        const insertB = await db.insert(organizations).values({
            id: "org_test_b_" + Date.now(),
            name: "Test Company B",
            slug: "test-company-b",
        }).returning();
        orgB = insertB[0];
        console.log("Using existing organization:", orgA.name);
        console.log("Created organization:", orgB.name);
    } else {
        orgA = orgs[0];
        orgB = orgs[1];
        console.log("Using existing organizations:", orgA.name, "and", orgB.name);
    }

    // Check if user exists
    let user = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });

    if (!user) {
        console.log("User not found in database. Creating user record...");
        const insertResult = await db.insert(users).values({
            id: userId,
            email: userEmail,
            firstName: "adam",
            lastName: "sky",
        }).returning();
        user = insertResult[0];
        console.log("Created user record");
    }

    // Check if employee record exists
    const existingEmployee = await db.query.employees.findFirst({
        where: eq(employees.userId, userId)
    });

    if (existingEmployee) {
        console.log("\\n⚠️  Employee record already exists!");
        console.log("--------------------------------");
        console.log(`User ID:      ${userId}`);
        console.log(`Email:        ${existingEmployee.email}`);
        console.log(`Organization: ${orgA.name}`);
        console.log(`Status:       ${existingEmployee.status}`);
        console.log("--------------------------------");
    } else {
        // Create employee record linked to Organization A
        await db.insert(employees).values({
            userId: userId,
            organizationId: orgA.id,
            email: userEmail,
            status: "active",
            role: "employee",
            joinedAt: new Date(),
        });

        console.log("\\n✅ Employee Record Created!");
        console.log("--------------------------------");
        console.log(`User:         adam sky`);
        console.log(`Email:        ${userEmail}`);
        console.log(`Organization: ${orgA.name} (Current)`);
        console.log(`Transfer To:  ${orgB.name}`);
        console.log("--------------------------------");
        console.log("\\n📝 Test Instructions:");
        console.log("1. Refresh your dashboard page");
        console.log("2. You should now see your organization");
        console.log("3. Use invitation code: TEST-TRANSFER-2419");
        console.log("4. This will transfer you from", orgA.name, "to", orgB.name);
        console.log("--------------------------------");
    }

    process.exit(0);
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
