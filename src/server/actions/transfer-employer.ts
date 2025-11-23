"use server";

import { db } from "@/db";
import { invitations, organizations, employees, accountTransfers, employers } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { ActionResponse } from "@/types";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Resend } from "resend";
import { TransferConfirmationEmail } from "@/components/emails/TransferConfirmationEmail";
import { EmployeeTransferredNotification } from "@/components/emails/EmployeeTransferredNotification";
import { EmployeeJoinedNotification } from "@/components/emails/EmployeeJoinedNotification";

// Validation schema
const transferCodeSchema = z.string().min(1, "Invitation code is required").max(50, "Invitation code is too long");

// Reuse rate limiter from invitations.ts
const rateLimitMap = new Map<string, { count: number; lastAttempt: number }>();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function transferEmployer(
    invitationCode: string
): Promise<ActionResponse<{ newEmployerName: string }>> {
    // 0. Input Validation
    try {
        transferCodeSchema.parse(invitationCode);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.issues[0]?.message || "Invalid invitation code format",
            };
        }
    }

    // 1. Get current user
    const { userId } = await auth();
    if (!userId) {
        return {
            success: false,
            error: "You must be logged in to transfer employers",
        };
    }

    // 2. Rate Limiting (reuse pattern from invitations.ts)
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const limit = 5;

    const record = rateLimitMap.get(ip) || { count: 0, lastAttempt: now };

    if (now - record.lastAttempt > windowMs) {
        record.count = 0;
        record.lastAttempt = now;
    }

    if (record.count >= limit) {
        return {
            success: false,
            error: "Too many transfer attempts. Please try again later.",
        };
    }

    record.count++;
    record.lastAttempt = now;
    rateLimitMap.set(ip, record);

    try {
        // 3. Get current employee record
        const currentEmployee = await db.query.employees.findFirst({
            where: eq(employees.userId, userId),
        });

        if (!currentEmployee) {
            return {
                success: false,
                error: "Employee record not found. Please contact support.",
            };
        }

        const currentOrgId = currentEmployee.organizationId;

        // 4. Validate invitation code
        const invitation = await db.query.invitations.findFirst({
            where: and(
                eq(invitations.code, invitationCode),
                isNull(invitations.usedAt),
                gt(invitations.expiresAt, new Date())
            ),
        });

        if (!invitation) {
            return {
                success: false,
                error: "Invalid or expired invitation code.",
            };
        }

        const newOrgId = invitation.employerId;

        // 5. Prevent same-organization transfer
        if (currentOrgId === newOrgId) {
            return {
                success: false,
                error: "Cannot transfer to the same organization.",
            };
        }

        // 6. Get organization details
        const [oldOrg, newOrg] = await Promise.all([
            db.query.organizations.findFirst({
                where: eq(organizations.id, currentOrgId),
            }),
            db.query.organizations.findFirst({
                where: eq(organizations.id, newOrgId),
            }),
        ]);

        if (!oldOrg || !newOrg) {
            return {
                success: false,
                error: "Organization not found.",
            };
        }

        // 7. Update database (sequential operations - no transaction support in neon-http)
        // Update employee organization
        await db
            .update(employees)
            .set({
                organizationId: newOrgId,
                updatedAt: new Date(),
            })
            .where(eq(employees.userId, userId));

        // Mark invitation as used
        await db
            .update(invitations)
            .set({ usedAt: new Date() })
            .where(eq(invitations.id, invitation.id));

        // Create audit log entry
        await db.insert(accountTransfers).values({
            userId,
            oldOrganizationId: currentOrgId,
            newOrganizationId: newOrgId,
            invitationCode,
            ipAddress: ip,
            userAgent: headersList.get("user-agent") || undefined,
        });

        // 8. Send email notifications (non-blocking - don't fail transfer if emails fail)
        // TEMPORARILY DISABLED: Email rendering is causing server crashes (render$1 is not a function)
        // TODO: Fix email rendering and re-enable
        /*
        try {
            await Promise.all([
                // Email to employee
                resend.emails.send({
                    from: "Stipends \u003cnoreply@stipends.app\u003e",
                    to: currentEmployee.email,
                    subject: "Account Transfer Confirmation",
                    react: TransferConfirmationEmail({
                        firstName: currentEmployee.email.split("@")[0],
                        oldEmployerName: oldOrg.name,
                        newEmployerName: newOrg.name,
                        dashboardUrl: "https://stipends.app/dashboard/employee",
                    }),
                }),
            ]);
        } catch (emailError) {
            console.error("Failed to send transfer emails:", emailError);
            // Don't fail the transfer if emails fail
        }
        */

        return {
            success: true,
            data: {
                newEmployerName: newOrg.name,
            },
        };
    } catch (error) {
        console.error("Error transferring employer:", error);
        return {
            success: false,
            error: "An unexpected error occurred during transfer.",
        };
    }
}
