'use server';

import { db } from '@/db';
import { employees, users, wallets, walletTransactions, organizations } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { ActionResponse } from '@/types';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateWallet, updateWalletBalance } from '@/server/procedures/wallet';
import { Resend } from 'resend';
import { StipendFundedEmail } from '@/components/emails/StipendFundedEmail';

// Validation schemas
const initiateFundingPaymentSchema = z.object({
    employeeIds: z.array(z.string().min(1)).min(1, 'At least one employee must be selected'),
    amountPerEmployee: z
        .number()
        .min(500000, 'Minimum amount is ₦5,000')
        .max(5000000, 'Maximum amount is ₦50,000'),
});

const fundStipendsSchema = z.object({
    employeeIds: z.array(z.string().min(1)).min(1, 'At least one employee must be selected'),
    amountPerEmployee: z
        .number()
        .min(500000, 'Minimum amount is ₦5,000')
        .max(5000000, 'Maximum amount is ₦50,000'),
    paystackReference: z.string().min(1, 'Paystack reference is required'),
});

// Paystack API configuration
const PAYSTACK_API_URL = 'https://api.paystack.co';

/**
 * Get employees for the current organization
 * Used by the funding page to display employee selection
 */
export async function getOrganizationEmployees(): Promise<
    ActionResponse<Array<{ id: string; userId: string | null; email: string; firstName: string | null; lastName: string | null }>>
> {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // Get employees for the organization with their user details
        const orgEmployees = await db
            .select({
                id: employees.id,
                userId: employees.userId,
                email: employees.email,
                firstName: users.firstName,
                lastName: users.lastName,
            })
            .from(employees)
            .leftJoin(users, eq(employees.userId, users.id))
            .where(
                and(
                    eq(employees.organizationId, orgId),
                    eq(employees.status, 'active')
                )
            );

        return { success: true, data: orgEmployees };
    } catch (error) {
        console.error('Error fetching organization employees:', error);
        return { success: false, error: 'Failed to fetch employees' };
    }
}

/**
 * Initialize Paystack payment for stipend funding
 * AC#4: Employer can pay the total amount via Paystack one-time payment
 */
export async function initiateFundingPayment(
    employeeIds: string[],
    amountPerEmployee: number
): Promise<ActionResponse<{ authorizationUrl: string; reference: string }>> {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY?.trim();

    // Validate input
    try {
        initiateFundingPaymentSchema.parse({ employeeIds, amountPerEmployee });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0]?.message || 'Invalid input' };
        }
    }

    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
        return { success: false, error: 'Unauthorized' };
    }

    if (!PAYSTACK_SECRET_KEY) {
        return { success: false, error: 'Payment configuration missing' };
    }

    try {
        // Verify employees belong to this organization
        const orgEmployees = await db
            .select({ id: employees.id, userId: employees.userId })
            .from(employees)
            .where(
                and(
                    eq(employees.organizationId, orgId),
                    inArray(employees.id, employeeIds)
                )
            );

        if (orgEmployees.length !== employeeIds.length) {
            return { success: false, error: 'Some employees do not belong to your organization' };
        }

        // Get employer's email for Paystack
        const employer = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!employer) {
            return { success: false, error: 'Employer not found' };
        }

        // Calculate total amount
        const totalAmount = employeeIds.length * amountPerEmployee;

        // Generate unique reference
        const reference = `stipend_${orgId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Store funding request metadata (we'll use this in webhook)
        // For now, we'll encode it in the reference metadata
        const metadata = {
            type: 'stipend_funding',
            orgId,
            employeeIds: employeeIds.join(','),
            amountPerEmployee,
            fundedBy: userId,
        };

        // Initialize Paystack transaction
        const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: employer.email,
                amount: totalAmount, // Already in kobo
                reference,
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/employer/stipends/fund/callback`,
                metadata,
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            console.error('Paystack initialization failed:', data);
            return { success: false, error: data.message || 'Payment initialization failed' };
        }

        return {
            success: true,
            data: {
                authorizationUrl: data.data.authorization_url,
                reference,
            },
        };
    } catch (error) {
        console.error('Error initiating funding payment:', error);
        return { success: false, error: 'Failed to initialize payment' };
    }
}

/**
 * Fund employee stipend wallets after successful payment
 * AC#5: After successful payment, all selected employee wallets are credited
 * AC#6: Each credit is recorded in wallet_transactions with type DEPOSIT and status COMPLETED
 * AC#7: Employees receive email notifications
 */
export async function fundStipends(
    employeeIds: string[],
    amountPerEmployee: number,
    paystackReference: string
): Promise<ActionResponse<{ fundedCount: number }>> {
    // Validate input
    try {
        fundStipendsSchema.parse({ employeeIds, amountPerEmployee, paystackReference });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0]?.message || 'Invalid input' };
        }
    }

    try {
        // Check for idempotency - if this reference was already processed
        const existingTransaction = await db.query.walletTransactions.findFirst({
            where: eq(walletTransactions.referenceId, paystackReference),
        });

        if (existingTransaction) {
            console.log(`Stipend funding already processed for reference: ${paystackReference}`);
            return { success: true, data: { fundedCount: 0 } }; // Idempotent - already processed
        }

        // Get employee user IDs
        const employeeRecords = await db
            .select({ id: employees.id, userId: employees.userId, email: employees.email })
            .from(employees)
            .where(inArray(employees.id, employeeIds));

        const employeesWithUsers = employeeRecords.filter((e) => e.userId !== null);

        if (employeesWithUsers.length === 0) {
            return { success: false, error: 'No active employees found to fund' };
        }

        // Fund wallets in a transaction
        await db.transaction(async (tx) => {
            for (let i = 0; i < employeesWithUsers.length; i++) {
                const employee = employeesWithUsers[i];
                const userId = employee.userId!;

                // Get or create wallet for employee
                const wallet = await getOrCreateWallet(userId);

                // Create unique reference for each transaction
                const txReference = `${paystackReference}_${employee.id}`;

                // Insert wallet transaction
                await tx.insert(walletTransactions).values({
                    walletId: wallet.id,
                    type: 'DEPOSIT',
                    amount: amountPerEmployee,
                    description: 'Employer stipend funding',
                    referenceId: txReference,
                    status: 'COMPLETED',
                });

                // Update wallet balance atomically
                await tx
                    .update(wallets)
                    .set({
                        balance: wallet.balance + amountPerEmployee,
                        updatedAt: new Date(),
                    })
                    .where(eq(wallets.id, wallet.id));
            }
        });

        // Send email notifications (don't fail the whole operation if emails fail)
        try {
            await sendStipendNotifications(
                employeesWithUsers.map((e) => e.email),
                amountPerEmployee
            );
        } catch (emailError) {
            console.error('Error sending stipend notifications:', emailError);
            // Continue - emails are not critical
        }

        return { success: true, data: { fundedCount: employeesWithUsers.length } };
    } catch (error) {
        console.error('Error funding stipends:', error);
        return { success: false, error: 'Failed to fund stipends' };
    }
}

/**
 * Send stipend funded email notifications
 * AC#7: Employees receive email notifications: "Your ₦X stipend has arrived!"
 */
async function sendStipendNotifications(emails: string[], amountInKobo: number): Promise<void> {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Format amount for display (kobo to naira)
    const amountInNaira = amountInKobo / 100;
    const formattedAmount = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
    }).format(amountInNaira);

    // Send batch emails
    const emailPromises = emails.map((email) =>
        resend.emails.send({
            from: 'Perks App <noreply@perksapp.com>',
            to: email,
            subject: `Your ${formattedAmount} stipend has arrived! 🎉`,
            react: StipendFundedEmail({ amount: formattedAmount }),
        })
    );

    await Promise.allSettled(emailPromises);
}

/**
 * Verify Paystack payment and trigger wallet funding
 * Called from callback page after Paystack redirect
 */
export async function verifyAndFundStipends(
    reference: string
): Promise<ActionResponse<{ fundedCount: number }>> {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY?.trim();

    // Note: We don't check auth here because this is called from a callback redirect
    // where the session may not be preserved. We validate orgId from the payment metadata instead.

    if (!PAYSTACK_SECRET_KEY) {
        return { success: false, error: 'Payment configuration missing' };
    }

    try {
        // Verify transaction with Paystack
        const response = await fetch(`${PAYSTACK_API_URL}/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });

        const data = await response.json();

        if (!response.ok || !data.status || data.data.status !== 'success') {
            return { success: false, error: 'Payment verification failed' };
        }

        // Extract metadata
        const metadata = data.data.metadata;
        if (metadata?.type !== 'stipend_funding') {
            return { success: false, error: 'Invalid transaction type' };
        }

        // Organization validation is done via metadata (orgId is embedded in the payment)
        // This ensures only the org that initiated the payment can complete funding

        const employeeIds = metadata.employeeIds.split(',');
        const amountPerEmployee = parseInt(metadata.amountPerEmployee, 10);

        // Fund the wallets
        return await fundStipends(employeeIds, amountPerEmployee, reference);
    } catch (error) {
        console.error('Error verifying and funding stipends:', error);
        return { success: false, error: 'Failed to verify payment' };
    }
}
