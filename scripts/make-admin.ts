
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import path from 'path';

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listAndPromoteAdmins() {
    // Dynamic import to ensure env vars are loaded first
    const { db } = await import('../src/db');
    const { organizations, employers, users } = await import('../src/db/schema');

    // Check if we have any employers
    const existingEmployers = await db.select().from(employers).limit(1);

    if (existingEmployers.length === 0) {
        console.log('⚠️ No employer records found in DB.');
        console.log('Attempting to fix by linking a User to an Organization...');

        // Find a user (any user)
        const user = await db.query.users.findFirst();
        // Find an org (preferably Stipends)
        const org = await db.query.organizations.findFirst({
            where: (organizations, { eq }) => eq(organizations.name, 'Stipends')
        }) || await db.query.organizations.findFirst();

        if (user && org) {
            console.log(`Found User: ${user.email} (${user.id})`);
            console.log(`Found Org: ${org.name} (${org.id})`);
            console.log('Creating Admin Employer record...');

            await db.insert(employers).values({
                userId: user.id,
                organizationId: org.id,
                role: 'admin'
            });
            console.log('✅ Created new Admin Employer record!');
            return process.exit(0);
        } else {
            console.error('❌ Could not find a User or Organization to link. Please ensure you have signed up and created an org in Clerk/DB.');
            return process.exit(1);
        }
    }

    // Existing logic for finding and promoting
    const allEmployers = await db
        .select({
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            orgName: organizations.name,
            role: employers.role,
            orgId: employers.organizationId,
            userId: employers.userId
        })
        .from(employers)
        .leftJoin(users, eq(employers.userId, users.id))
        .leftJoin(organizations, eq(employers.organizationId, organizations.id));

    console.log('\n--- All Employers in DB ---');
    allEmployers.forEach(e => {
        console.log(`User: ${e.firstName} ${e.lastName} (${e.email})`);
        console.log(`Org: ${e.orgName} (${e.orgId})`);
        console.log(`Role: ${e.role}`);
        console.log('-------------------------');
    });

    // Auto-promote if we find "Stipends" or similar
    const stipendsEmp = allEmployers.find(e => e.orgName === 'Stipends');
    if (stipendsEmp) {
        console.log(`\nFound Stipends employee: ${stipendsEmp.email}. Promoting to admin...`);
        await db.update(employers)
            .set({ role: 'admin' })
            .where(eq(employers.organizationId, stipendsEmp.orgId));
        console.log('✅ Promoted to Admin.');
    } else if (allEmployers.length > 0) {
        console.log('\nStipends org not found via name match.');
        // Optional: Promote the first one found just in case? No, risky.
    }

    process.exit(0);
}

listAndPromoteAdmins().catch(console.error);
