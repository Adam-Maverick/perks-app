import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, employees, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'ilereb31927@gaabiace.com';

    try {
        // Get user
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if employee record exists
        const employee = await db.query.employees.findFirst({
            where: eq(employees.userId, user.id),
        });

        // Get organization if employee exists
        let organization = null;
        if (employee) {
            organization = await db.query.organizations.findFirst({
                where: eq(organizations.id, employee.organizationId),
            });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            employee: employee ? {
                id: employee.id,
                organizationId: employee.organizationId,
                status: employee.status,
            } : null,
            organization: organization ? {
                id: organization.id,
                name: organization.name,
            } : null,
            instructions: employee ?
                '✅ Employee record already exists!' :
                `⚠️ No employee record. Use this ID to create one: ${user.id}`,
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
