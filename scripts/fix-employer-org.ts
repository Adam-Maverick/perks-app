/**
 * Script to verify and fix employer setup for akangbeadam@gmail.com
 * 
 * Usage: npx tsx scripts/fix-employer-org.ts
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function fixEmployerOrg() {
    const EMAIL = 'akangbeadam@gmail.com';

    console.log('=== Current Status ===\n');

    // Get user
    const user = await db.query.users.findFirst({
        where: eq(schema.users.email, EMAIL),
    });

    if (!user) {
        console.error(`User not found: ${EMAIL}`);
        await pool.end();
        return;
    }
    console.log(`User: ${user.id} (${user.email})`);

    // Get all organizations
    console.log('\n--- Organizations ---');
    const orgs = await db.query.organizations.findMany();
    orgs.forEach((o) => console.log(`  ${o.id}: ${o.name}`));

    // Get employer records for this user
    console.log('\n--- Employer Records ---');
    const employers = await db.query.employers.findMany({
        where: eq(schema.employers.userId, user.id),
    });
    employers.forEach((e) => console.log(`  ${e.id}: org=${e.organizationId}, role=${e.role}`));

    // Get employee for adamsky737 to find Stipends org
    console.log('\n--- Looking for Stipends org via adamsky737 employee ---');
    const adamUser = await db.query.users.findFirst({
        where: eq(schema.users.email, 'adamsky737@gmail.com'),
    });

    if (adamUser) {
        const adamEmployee = await db.query.employees.findFirst({
            where: eq(schema.employees.userId, adamUser.id),
        });
        if (adamEmployee) {
            console.log(`Found adamsky737 employee with org: ${adamEmployee.organizationId}`);

            // Check if akangbeadam is already employer for this org
            const existingEmployer = await db.query.employers.findFirst({
                where: and(
                    eq(schema.employers.userId, user.id),
                    eq(schema.employers.organizationId, adamEmployee.organizationId)
                ),
            });

            if (existingEmployer) {
                console.log(`\n✅ akangbeadam is already an employer for this org!`);
            } else {
                console.log(`\n⚠️ akangbeadam is NOT an employer for Stipends org. Adding...`);

                const [newEmployer] = await db
                    .insert(schema.employers)
                    .values({
                        userId: user.id,
                        organizationId: adamEmployee.organizationId,
                        role: 'admin',
                    })
                    .returning();

                console.log(`✅ Added employer record: ${newEmployer.id}`);
            }
        }
    }

    await pool.end();
}

fixEmployerOrg()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
