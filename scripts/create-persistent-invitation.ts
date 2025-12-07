
import { db } from "@/db";
import { invitations, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function main() {
    // 1. Setup: Ensure an organization exists
    let org = await db.query.organizations.findFirst();

    if (!org) {
        const createdOrgId = `org_test_${Date.now()}`;
        await db.insert(organizations).values({
            id: createdOrgId,
            name: "Browser Test Corp",
            slug: `browser-test-corp-${Date.now()}`,
        });
        org = await db.query.organizations.findFirst({
            where: eq(organizations.id, createdOrgId)
        });
    }

    if (!org) throw new Error("Failed to get organization");

    // 2. Create a persistent invitation code
    const code = `BROWSER-TEST-${Math.floor(Math.random() * 10000)}`;

    await db.insert(invitations).values({
        code: code,
        employerId: org.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    console.log(`INVITATION_CODE:${code}`);
    console.log(`ORG_NAME:${org.name}`);

    process.exit(0);
}

main().catch(console.error);
