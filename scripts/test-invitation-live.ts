
import { db } from "@/db";
import { invitations, organizations } from "@/db/schema";
import { validateInvitationCode } from "@/server/actions/invitations";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function main() {
    console.log("🚀 Starting Live Invitation Test...");

    // 1. Setup: Ensure an organization exists
    let org = await db.query.organizations.findFirst();
    let createdOrgId: string | null = null;

    if (!org) {
        console.log("ℹ️ No organization found, creating test organization...");
        createdOrgId = `org_test_${Date.now()}`;
        await db.insert(organizations).values({
            id: createdOrgId, // Clerk ID format
            name: "Test Corp Live",
            slug: `test-corp-${Date.now()}`,
        });
        org = await db.query.organizations.findFirst({
            where: eq(organizations.id, createdOrgId)
        });
    }

    if (!org) throw new Error("Failed to get organization");
    console.log(`✅ Using Organization: ${org.name} (${org.id})`);

    // 2. Setup: Create a valid invitation code
    const testCode = `TEST-INVITE-${Date.now()}`;
    const testInviteId = uuidv4();

    console.log(`ℹ️ Creating test invitation: ${testCode}`);
    await db.insert(invitations).values({
        id: testInviteId,
        code: testCode,
        employerId: org.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24h
    });

    try {
        // 3. Test: Validate Valid Code
        console.log("\n🧪 Testing Valid Code...");
        const validResult = await validateInvitationCode(testCode, "127.0.0.1");

        if (validResult.success) {
            console.log("✅ Valid Code Test PASSED");
            console.log("   Data:", validResult.data);
            if (validResult.data?.employerName !== org.name) {
                console.error("❌ Employer Name mismatch!");
            }
        } else {
            console.error("❌ Valid Code Test FAILED");
            console.error("   Error:", validResult.error);
        }

        // 4. Test: Validate Invalid Code
        console.log("\n🧪 Testing Invalid Code...");
        const invalidResult = await validateInvitationCode("INVALID-CODE-XYZ", "127.0.0.1");

        if (!invalidResult.success) {
            console.log("✅ Invalid Code Test PASSED (Correctly rejected)");
            console.log("   Error message:", invalidResult.error);
        } else {
            console.error("❌ Invalid Code Test FAILED (Should have been rejected)");
        }

    } catch (err) {
        console.error("💥 Unexpected error during test:", err);
    } finally {
        // 5. Cleanup
        console.log("\n🧹 Cleaning up test data...");
        await db.delete(invitations).where(eq(invitations.id, testInviteId));
        if (createdOrgId) {
            await db.delete(organizations).where(eq(organizations.id, createdOrgId));
        }
        console.log("✅ Cleanup complete.");
        process.exit(0);
    }
}

main().catch(console.error);
