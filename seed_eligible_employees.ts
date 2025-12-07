
import { db } from './src/db';
import { users, organizations, employees } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function main() {
    console.log('--- Ensuring Eligible Employees for All Orgs ---');

    const orgs = await db.select().from(organizations);
    console.log(`Found ${orgs.length} organizations.`);

    for (const org of orgs) {
        console.log(`Processing Org: ${org.name} (${org.id})`);

        // Check for existing eligible employees
        const existingEligible = await db.query.employees.findFirst({
            where: (e, { and, eq, isNotNull }) =>
                and(
                    eq(e.organizationId, org.id),
                    eq(e.status, 'active'),
                    isNotNull(e.userId)
                )
        });

        if (existingEligible) {
            console.log(`  - Already has eligible employee: ${existingEligible.email}`);
            continue;
        }

        console.log('  - No eligible employee found. Creating/Linking one...');

        // Check for any employee (unlinked)
        const unlinkedEmployee = await db.query.employees.findFirst({
            where: (e, { and, eq, isNull }) =>
                and(
                    eq(e.organizationId, org.id),
                    eq(e.status, 'active'),
                    isNull(e.userId)
                )
        });

        let employeeId = unlinkedEmployee?.id;
        let employeeEmail = unlinkedEmployee?.email;

        if (!employeeId) {
            // Create new employee
            const newId = uuidv4();
            const email = `employee_${org.slug}_${Date.now()}@test.com`;
            await db.insert(employees).values({
                id: newId,
                organizationId: org.id,
                email: email,
                status: 'active',
                role: 'MEMBER',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            employeeId = newId;
            employeeEmail = email;
            console.log(`    > Created new employee record: ${email}`);
        } else {
            console.log(`    > Using existing unlinked employee: ${employeeEmail}`);
        }

        // Create a user to link
        const newUserId = `user_${uuidv4()}`; // Clerk-like ID
        await db.insert(users).values({
            id: newUserId,
            email: employeeEmail!,
            firstName: 'Test',
            lastName: 'Employee',
            role: 'employee',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`    > Created backing User: ${newUserId}`);

        // Link them
        await db.update(employees)
            .set({ userId: newUserId })
            .where(eq(employees.id, employeeId!));

        console.log(`    > Linked User to Employee!`);
    }
}

main().catch(console.error).finally(() => process.exit(0));
