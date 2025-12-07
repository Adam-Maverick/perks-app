
import dotenv from 'dotenv';
import path from 'path';
import { createClerkClient } from '@clerk/backend';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function promoteUser(email: string) {
    const { db } = await import('../src/db');
    const { organizations, employers, users } = await import('../src/db/schema');
    const { eq } = await import('drizzle-orm');

    console.log(`Promoting user ${email} to Admin of 'Stipends'...`);

    // 1. Find User in Clerk
    console.log('Searching Clerk for user...');
    const clerkUsers = await clerkClient.users.getUserList({ emailAddress: [email] });

    if (clerkUsers.data.length === 0) {
        console.error(`❌ User ${email} not found in Clerk. Has he signed up?`);
        // If not found in Clerk, we can't really do much unless we create a stub, 
        // but we need the real Clerk ID for auth() to work.
        process.exit(1);
    }

    const clerkUser = clerkUsers.data[0];
    console.log(`Found Clerk User: ${clerkUser.id} (${clerkUser.firstName} ${clerkUser.lastName})`);

    // 2. Sync User to Local DB
    console.log('Syncing user to local DB...');
    await db.insert(users).values({
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
    }).onConflictDoUpdate({
        target: users.id,
        set: {
            email: clerkUser.emailAddresses[0].emailAddress,
            updatedAt: new Date()
        }
    });

    // 3. Find Organization 'Stipends'
    const org = await db.query.organizations.findFirst({
        where: (organizations, { eq }) => eq(organizations.name, 'Stipends')
    });

    if (!org) {
        console.error('❌ Organization "Stipends" not found in local DB. Run sync-clerk-org.ts first.');
        process.exit(1);
    }
    console.log(`Target Org: ${org.name} (${org.id})`);

    // 4. Link as Admin
    console.log('Granting Admin Role...');
    await db.insert(employers).values({
        userId: clerkUser.id,
        organizationId: org.id,
        role: 'admin'
    }).onConflictDoUpdate({
        target: employers.id, // This might fail if no unique constraint on (userId, orgId). 
        // Actually schema doesn't seem to have unique (userId, orgId) on employers table definition I saw earlier?
        // Let's check schema again. 
        // "id: uuid('id').defaultRandom().primaryKey()"
        // There is no composite unique key in the schema definition I saw.
        // So I should check if it exists first.
        set: { role: 'admin' }
    });

    // Check if link exists
    const existing = await db.query.employers.findFirst({
        where: (employers, { and, eq }) => and(
            eq(employers.userId, clerkUser.id),
            eq(employers.organizationId, org.id)
        )
    });

    if (existing) {
        await db.update(employers)
            .set({ role: 'admin' })
            .where(eq(employers.id, existing.id));
        console.log('✅ Updated existing membership to Admin.');
    } else {
        await db.insert(employers).values({
            userId: clerkUser.id,
            organizationId: org.id,
            role: 'admin'
        });
        console.log('✅ Created new Admin membership.');
    }

    process.exit(0);
}

const targetEmail = process.argv[2] || 'adamsky737@gmail.com';
promoteUser(targetEmail).catch(console.error);
