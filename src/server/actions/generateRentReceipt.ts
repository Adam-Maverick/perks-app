'use server';

import { z } from 'zod';
import { db } from '@/db';
import { rentReceipts, users } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { ActionResponse } from '@/types';
import { renderRentReceiptPdf } from '@/lib/pdf-generator';
import { put } from '@vercel/blob';
import { actionRateLimiter } from '@/lib/rate-limit';

// Validation Schema
const rentReceiptSchema = z.object({
    landlordName: z.string().min(1, 'Landlord name is required').max(200),
    propertyAddress: z.string().min(1, 'Property address is required').max(500),
    rentAmount: z.number()
        .min(5000000, 'Minimum rent amount is ₦50,000 (50000 kobo)')
        .max(500000000, 'Maximum rent amount is ₦5,000,000'),
    paymentDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
    }),
});

export type RentReceiptFormInput = z.infer<typeof rentReceiptSchema>;

export type RentReceiptResult = {
    receiptId: string;
    pdfUrl: string;
};

/**
 * Server Action: Generate a rent receipt PDF
 * 
 * Security: Validates auth().userId to prevent IDOR
 * Rate Limiting: 5 requests per hour per user
 * 
 * @param input - Rent receipt form data
 * @returns ActionResponse with PDF URL and receipt ID
 */
export async function generateRentReceipt(
    input: RentReceiptFormInput
): Promise<ActionResponse<RentReceiptResult>> {
    try {
        // 1. Authentication Check (CRITICAL: Prevent IDOR)
        const { userId } = await auth();

        if (!userId) {
            return {
                success: false,
                error: 'Unauthorized. Please sign in.',
            };
        }

        // 2. Rate Limiting (5 requests per hour)
        if (actionRateLimiter) {
            const { success: allowed, remaining } = await actionRateLimiter.limit(userId);
            if (!allowed) {
                return {
                    success: false,
                    error: `Too many requests. You have ${remaining} receipts remaining this hour.`,
                };
            }
        }

        // 3. Input Validation
        const validatedInput = rentReceiptSchema.parse(input);

        // 4. Get user details for the receipt
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            return {
                success: false,
                error: 'User not found.',
            };
        }

        // 5. Generate PDF
        const receiptNo = `RR-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
        const paymentDateObj = new Date(validatedInput.paymentDate);
        const tenantName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

        const pdfBuffer = await renderRentReceiptPdf({
            receiptNo,
            date: new Date().toLocaleDateString('en-NG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            tenantName,
            amount: validatedInput.rentAmount / 100, // Convert kobo to Naira for display
            period: paymentDateObj.toLocaleDateString('en-NG', {
                year: 'numeric',
                month: 'long',
            }),
            propertyAddress: validatedInput.propertyAddress,
            landlordName: validatedInput.landlordName,
        });

        // 6. Upload to Vercel Blob
        const filename = `rent-receipts/${userId}/${receiptNo}.pdf`;
        const blob = await put(filename, pdfBuffer, {
            access: 'public',
            contentType: 'application/pdf',
        });

        // 7. Save record to database
        const [receipt] = await db.insert(rentReceipts).values({
            userId,
            landlordName: validatedInput.landlordName,
            propertyAddress: validatedInput.propertyAddress,
            rentAmount: validatedInput.rentAmount,
            paymentDate: paymentDateObj,
            pdfUrl: blob.url,
        }).returning();

        return {
            success: true,
            data: {
                receiptId: receipt.id,
                pdfUrl: blob.url,
            },
        };

    } catch (error) {
        console.error('Error generating rent receipt:', error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: 'Invalid input: ' + error.issues.map(e => e.message).join(', '),
            };
        }

        return {
            success: false,
            error: 'Failed to generate rent receipt. Please try again.',
        };
    }
}
