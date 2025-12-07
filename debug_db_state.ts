
import { db } from './src/db';
import { users, organizations, employees } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('--- Organizations ---');
    const orgs = await db.select().from(organizations);
    console.table(orgs);

    console.log('\n--- Users ---');
    const allUsers = await db.select().from(users);
    console.table(allUsers.map(u => ({ id: u.id, email: u.email, role: u.role })));

    console.log('\n--- Employees ---');
    const allEmployees = await db.select().from(employees);
    console.table(allEmployees);

    if (allEmployees.length === 0) {
        console.log('No employees found! Seeding needed?');
    } else {
        // Check active status
        const active = allEmployees.filter(e => e.status === 'active');
        console.log(`\nActive employees: ${active.length} / ${allEmployees.length}`);
    }
}

main().catch(console.error).finally(() => process.exit(0));
