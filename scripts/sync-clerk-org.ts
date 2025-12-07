
import dotenv from 'dotenv';
import path from 'path';
import { createClerkClient } from '@clerk/backend';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function syncStipends() {
    const { db } = await import('../src/db');
    const { organizations, employers, users } = await import('../src/db/schema');
    const { eq } = await import('drizzle-orm');

    console.log('Fetching organizations from Clerk...');
    const clerkOrgs = await clerkClient.organizations.getOrganizationList({ limit: 100 });

    const stipendsOrg = clerkOrgs.data.find(o => o.name === 'Stipends');

    if (!stipendsOrg) {
        console.error('❌ Could not find "Stipends" organization in Clerk.');
        console.log('Available Clerk Orgs:', clerkOrgs.data.map(o => o.name).join(', '));
        process.exit(1);
    }

    console.log(`Found Clerk Org: ${stipendsOrg.name} (${stipendsOrg.id})`);

    // Sync to DB
    console.log('Syncing to local database...');
    await db.insert(organizations).values({
        id: stipendsOrg.id,
        name: stipendsOrg.name,
        slug: stipendsOrg.slug || `stipends-${stipendsOrg.id.slice(0, 5)}`,
        logoUrl: stipendsOrg.imageUrl,
    }).onConflictDoUpdate({
        target: organizations.id,
        set: {
            name: stipendsOrg.name,
            logoUrl: stipendsOrg.imageUrl,
            updatedAt: new Date()
        }
    });
    console.log('✅ Organization synced.');

    // Now make the first user an admin of this org
    // Get users in this org from Clerk
    const memberships = await clerkClient.organizations.getOrganizationMembershipList({ organizationId: stipendsOrg.id });
    const adminMember = memberships.data.find(m => m.role === 'org:admin') || memberships.data[0];

    if (!adminMember) {
        console.log('No members found in Clerk org. Checking local users...');
        const user = await db.query.users.findFirst();
        if (user) {
            console.log(`Linking local user ${user.email} as admin.`);
            await db.insert(employers).values({
                userId: user.id,
                organizationId: stipendsOrg.id,
                role: 'admin'
            }).onConflictDoNothing();
            console.log('✅ User linked as Admin.');
        }
    } else {
        console.log(`Found Clerk Member: ${adminMember.publicUserData?.identifier} (${adminMember.publicUserData?.userId})`);

        // Ensure user exists in local DB (might need sync too)
        // For now, assume user exists or just try to link
        // Actually, we should check if user exists in DB first
        const userExists = await db.query.users.findFirst({ where: (users, { eq }) => eq(users.id, adminMember.publicUserData!.userId) });

        if (!userExists) {
            console.log('User not in local DB. Creating stub...');
            await db.insert(users).values({
                id: adminMember.publicUserData!.userId,
                email: adminMember.publicUserData!.identifier,
                firstName: adminMember.publicUserData?.firstName || 'Admin',
                lastName: adminMember.publicUserData?.lastName || 'User',
            }).onConflictDoNothing();
        }

        await db.insert(employers).values({
            userId: adminMember.publicUserData!.userId,
            organizationId: stipendsOrg.id,
            role: 'admin'
        }).onConflictDoNothing();
        console.log('✅ Admin linked.');
    }

    process.exit(0);
}

syncStipends().catch(console.error);
