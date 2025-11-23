import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, organizations, employers, invitations, employees } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400,
        });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400,
        });
    }

    const eventType = evt.type;

    if (eventType === 'user.created') {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const email = email_addresses[0]?.email_address;

        if (email) {
            await db.insert(users).values({
                id,
                email,
                firstName: first_name,
                lastName: last_name,
                imageUrl: image_url,
            }).onConflictDoNothing();

            // Handle Invitation Code
            const invitationCode = evt.data.unsafe_metadata?.invitationCode as string | undefined;
            if (invitationCode) {
                const invitation = await db.query.invitations.findFirst({
                    where: eq(invitations.code, invitationCode),
                });

                if (invitation && !invitation.usedAt) {
                    // Link to organization
                    await db.insert(employees).values({
                        userId: id,
                        organizationId: invitation.employerId,
                        email: email,
                        role: 'employee',
                        status: 'active',
                        joinedAt: new Date(),
                    });

                    // Mark invitation as used
                    await db.update(invitations)
                        .set({ usedAt: new Date() })
                        .where(eq(invitations.id, invitation.id));

                    // Send Welcome Email
                    try {
                        const { Resend } = await import('resend');
                        const resend = new Resend(process.env.RESEND_API_KEY);
                        const { WelcomeEmail } = await import('@/components/emails/WelcomeEmail');

                        // We need to get employer name for the email
                        const org = await db.query.organizations.findFirst({
                            where: eq(organizations.id, invitation.employerId),
                        });

                        if (org) {
                            await resend.emails.send({
                                from: 'Perks App <onboarding@resend.dev>', // Update with verified domain in prod
                                to: email,
                                subject: `Welcome to ${org.name} on Perks App`,
                                react: WelcomeEmail({
                                    firstName: first_name || 'Employee',
                                    employerName: org.name,
                                    dashboardUrl: process.env.NEXT_PUBLIC_APP_URL
                                        ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/employee`
                                        : '/dashboard/employee',
                                }),
                            });
                        }
                    } catch (emailError) {
                        console.error('Error sending welcome email:', emailError);
                    }
                }
            }
        }
    }

    if (eventType === 'organization.created') {
        const { id, name, slug, image_url } = evt.data;

        await db.insert(organizations).values({
            id,
            name,
            slug,
            logoUrl: image_url,
        }).onConflictDoNothing();
    }

    if (eventType === 'organizationMembership.created') {
        const { public_user_data, organization } = evt.data;
        const userId = public_user_data.user_id;
        const orgId = organization.id;

        // Check if user exists first (race condition handling)
        // In a real app, we might want to queue this if user doesn't exist yet

        // For now, we assume user is created first or we handle it gracefully
        // We need to decide if this is an employee or employer based on role
        // Clerk roles: "admin", "basic_member"

        const role = evt.data.role === 'org:admin' ? 'admin' : 'member';

        if (role === 'admin') {
            await db.insert(employers).values({
                userId,
                organizationId: orgId,
                role: 'admin',
            }).onConflictDoNothing();
        } else {
            // It's an employee
            // We need to get their email to insert into employees table
            // This might require fetching user details if not present in payload
            // For MVP, we'll skip inserting into 'employees' table here and rely on
            // explicit invitation flow or subsequent login to populate 'employees'
            // OR we can insert a partial record if we have enough info.

            // Actually, the 'employees' table is the workforce roster.
            // 'organizationMembership' implies they joined.

            // Let's just log for now as the 'employees' table requires email which might not be in this payload
            console.log('Employee joined organization:', orgId, userId);
        }
    }

    return new Response('', { status: 200 });
}
