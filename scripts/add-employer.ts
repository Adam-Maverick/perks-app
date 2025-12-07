/**
 * Script to add akangbeadam@gmail.com as an employer
 * 
 * Usage: npx tsx scripts/add-employer.ts
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';

// Load environment variables from .env.local
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function addEmployer() {
    const EMAIL = 'akangbeadam@gmail.com';

    console.log(`🔍 Looking for user with email: ${EMAIL}`);

    // Find the user by email
    const user = await db.query.users.findFirst({
        where: eq(schema.users.email, EMAIL),
    });

    if (!user) {
        console.error(`❌ User not found with email: ${EMAIL}`);
        console.log('Available users:');
        const allUsers = await db.query.users.findMany();
        allUsers.forEach((u) => console.log(`  - ${u.email} (${u.id})`));
        await pool.end();
        process.exit(1);
    }

    console.log(`✅ Found user: ${user.id}`);

    // Find their employee record to get organization_id
    const employee = await db.query.employees.findFirst({
        where: eq(schema.employees.userId, user.id),
    });

    let organizationId: string;

    if (employee) {
        organizationId = employee.organizationId;
        console.log(`✅ Found employee record with org: ${organizationId}`);
    } else {
        // Try to find organization from other employees with same email domain or from organizations table
        console.log('⚠️ No employee record found, checking organizations...');
        const orgs = await db.query.organizations.findMany();
        if (orgs.length === 0) {
            console.error('❌ No organizations found');
            await pool.end();
            process.exit(1);
        }
        // Use the first organization (Stipends)
        organizationId = orgs[0].id;
        console.log(`Using organization: ${orgs[0].name} (${organizationId})`);
    }

    // Check if already an employer
    const existingEmployer = await db.query.employers.findFirst({
        where: eq(schema.employers.userId, user.id),
    });

    if (existingEmployer) {
        console.log(`ℹ️ User is already an employer (id: ${existingEmployer.id})`);
        await pool.end();
        return;
    }

    // Add as employer with admin role
    const [newEmployer] = await db
        .insert(schema.employers)
        .values({
            userId: user.id,
            organizationId,
            role: 'admin',
        })
        .returning();

    console.log(`✅ Added ${EMAIL} as employer!`);
    console.log(`   - Employer ID: ${newEmployer.id}`);
    console.log(`   - User ID: ${newEmployer.userId}`);
    console.log(`   - Organization ID: ${newEmployer.organizationId}`);
    console.log(`   - Role: ${newEmployer.role}`);

    await pool.end();
}

addEmployer()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
