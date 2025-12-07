/**
 * Fix employee organization for adamsky737@gmail.com
 * Move them to org_35peFVXpZZ0QdeZj0n57KzRyqyu (Stipends)
 * 
 * Usage: npx tsx scripts/fix-employee-org.ts
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';

config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function fixEmployeeOrg() {
    const EMPLOYEE_EMAIL = 'adamsky737@gmail.com';
    const TARGET_ORG_ID = 'org_35peFVXpZZ0QdeZj0n57KzRyqyu'; // Stipends org

    console.log('=== Fixing Employee Organization ===\n');

    // Get user
    const user = await db.query.users.findFirst({
        where: eq(schema.users.email, EMPLOYEE_EMAIL),
    });

    if (!user) {
        console.error(`User not found: ${EMPLOYEE_EMAIL}`);
        await pool.end();
        return;
    }
    console.log(`User ID: ${user.id}`);

    // Get current employee record
    const employee = await db.query.employees.findFirst({
        where: eq(schema.employees.userId, user.id),
    });

    if (!employee) {
        console.log('No employee record found. Creating one...');
        const [newEmployee] = await db
            .insert(schema.employees)
            .values({
                userId: user.id,
                organizationId: TARGET_ORG_ID,
                email: EMPLOYEE_EMAIL,
                role: 'employee',
                status: 'active',
            })
            .returning();
        console.log(`✅ Created employee: ${newEmployee.id}`);
    } else {
        console.log(`Current org: ${employee.organizationId}`);

        if (employee.organizationId === TARGET_ORG_ID) {
            console.log('✅ Already in correct organization!');
        } else {
            console.log(`Updating org to: ${TARGET_ORG_ID}`);
            await db
                .update(schema.employees)
                .set({ organizationId: TARGET_ORG_ID })
                .where(eq(schema.employees.id, employee.id));
            console.log('✅ Organization updated!');
        }
    }

    // Verify employer exists for this org
    console.log('\n--- Verifying employer for Stipends org ---');
    const employers = await db.query.employers.findMany({
        where: eq(schema.employers.organizationId, TARGET_ORG_ID),
    });
    console.log(`Employers for Stipends org: ${employers.length}`);
    employers.forEach((e) => console.log(`  - ${e.userId} (role: ${e.role})`));

    await pool.end();
    console.log('\n✅ Done! Refresh the funding page.');
}

fixEmployeeOrg()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
