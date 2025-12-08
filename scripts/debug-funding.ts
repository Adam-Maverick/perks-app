/**
 * Debug script to check database state for funding issues
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '../src/db/schema';

config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function debug() {
    console.log('=== Database Debug for Funding Issues ===\n');

    // 1. Check organizations
    console.log('--- Organizations ---');
    const orgs = await db.query.organizations.findMany();
    for (const org of orgs) {
        console.log(`  ${org.id}: ${org.name}`);
    }

    // 2. Check employees and their org IDs
    console.log('\n--- Employees ---');
    const employees = await db.query.employees.findMany();
    for (const emp of employees) {
        console.log(`  ${emp.email} -> org: ${emp.organizationId}, userId: ${emp.userId}`);
    }

    // 3. Check employers
    console.log('\n--- Employers ---');
    const employers = await db.query.employers.findMany();
    for (const emp of employers) {
        console.log(`  userId: ${emp.userId}, org: ${emp.organizationId}, role: ${emp.role}`);
    }

    console.log('\n=== Key Info for akangbeadam@gmail.com ===');
    const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, 'akangbeadam@gmail.com'),
    });

    if (user) {
        console.log(`User ID: ${user.id}`);

        // Find their employer record
        const employerRecords = await db.query.employers.findMany({
            where: (e, { eq }) => eq(e.userId, user.id),
        });
        console.log(`Employer orgs: ${employerRecords.map(e => e.organizationId).join(', ')}`);
    }

    await pool.end();
}

debug()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
