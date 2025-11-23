"use server";

import { db } from "@/db";
import { invitations, organizations } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { ActionResponse } from "@/types";
import { z } from "zod";

// Validation schema
const invitationCodeSchema = z.string().min(1, "Invitation code is required").max(50, "Invitation code is too long");

// Simple in-memory rate limiter for MVP (Note: resets on server restart/lambda cold start)
const rateLimitMap = new Map<string, { count: number; lastAttempt: number }>();

export async function validateInvitationCode(
    code: string,
    ip: string = "unknown" // In a real app, we'd extract this from headers
): Promise<ActionResponse<{ employerName: string; employerId: string }>> {
    // 0. Input Validation
    try {
        invitationCodeSchema.parse(code);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.issues[0]?.message || "Invalid invitation code format",
            };
        }
    }

    // 1. Rate Limiting
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const limit = 5;

    const record = rateLimitMap.get(ip) || { count: 0, lastAttempt: now };

    if (now - record.lastAttempt > windowMs) {
        // Reset if outside window
        record.count = 0;
        record.lastAttempt = now;
    }

    if (record.count >= limit) {
        return {
            success: false,
            error: "Too many attempts. Please try again later.",
        };
    }

    record.count++;
    record.lastAttempt = now;
    rateLimitMap.set(ip, record);

    try {
        // 2. Validate Code
        const invitation = await db.query.invitations.findFirst({
            where: and(
                eq(invitations.code, code),
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

        // 3. Get Employer Details
        const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, invitation.employerId),
        });

        if (!org) {
            return {
                success: false,
                error: "Associated employer not found.",
            };
        }

        return {
            success: true,
            data: {
                employerName: org.name,
                employerId: org.id,
            },
        };

    } catch (error) {
        console.error("Error validating invitation code:", error);
        return {
            success: false,
            error: "An unexpected error occurred.",
        };
    }
}
