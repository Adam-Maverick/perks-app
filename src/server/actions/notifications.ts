"use server";

import { db } from "@/db";
import { merchants, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ActionResponse } from "@/types";
import { z } from "zod";
import { Resend } from "resend";
import MerchantEscrowNotification from "@/components/emails/merchant-escrow-notification";

// Validation schema
const sendMerchantEscrowNotificationSchema = z.object({
    merchantId: z.string().uuid("Invalid merchant ID"),
    transactionId: z.string().uuid("Invalid transaction ID"),
});

// Resend configuration
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send escrow notification email to merchant
 * AC#3: Merchant receives notification: "Payment received. Funds held in escrow until delivery confirmed."
 */
export async function sendMerchantEscrowNotification(
    merchantId: string,
    transactionId: string
): Promise<ActionResponse<{ emailId: string }>> {
    // 0. Input Validation
    try {
        sendMerchantEscrowNotificationSchema.parse({ merchantId, transactionId });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.issues[0]?.message || "Invalid input",
            };
        }
    }

    try {
        // 1. Get merchant details
        const merchant = await db.query.merchants.findFirst({
            where: eq(merchants.id, merchantId),
        });

        if (!merchant) {
            return {
                success: false,
                error: "Merchant not found.",
            };
        }

        // 2. Get transaction details
        const transaction = await db.query.transactions.findFirst({
            where: eq(transactions.id, transactionId),
            with: {
                deal: true,
            },
        });

        if (!transaction) {
            return {
                success: false,
                error: "Transaction not found.",
            };
        }

        // 3. Parse merchant contact info for email
        let contactInfo: { email?: string };
        try {
            contactInfo = merchant.contactInfo ? JSON.parse(merchant.contactInfo) : {};
        } catch {
            return {
                success: false,
                error: "Invalid merchant contact information.",
            };
        }

        if (!contactInfo.email) {
            return {
                success: false,
                error: "Merchant email not configured.",
            };
        }

        // 4. Calculate expected release date (7 days from now)
        const releaseDate = new Date();
        releaseDate.setDate(releaseDate.getDate() + 7);

        // 5. Send email via Resend
        const { data, error } = await resend.emails.send({
            from: "Stipends <notifications@stipends.ng>",
            to: contactInfo.email,
            subject: "Payment Received - Funds Held in Escrow",
            react: MerchantEscrowNotification({
                merchantName: merchant.name,
                amount: transaction.amount,
                orderId: transaction.paystackReference || transaction.id,
                releaseDate: releaseDate.toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            }),
        });

        if (error) {
            console.error("Resend API error:", error);
            return {
                success: false,
                error: "Failed to send notification email.",
            };
        }

        return {
            success: true,
            data: {
                emailId: data?.id || "unknown",
            },
        };

    } catch (error) {
        console.error("Error sending merchant escrow notification:", error);
        return {
            success: false,
            error: "An unexpected error occurred.",
        };
    }
}
