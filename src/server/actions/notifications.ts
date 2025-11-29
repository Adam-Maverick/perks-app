"use server";

import { db } from "@/db";
import { merchants, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ActionResponse } from "@/types";
import { z } from "zod";
import { Resend } from "resend";
import { render } from "@react-email/render";
import EmployeeConfirmationEmail from "@/components/emails/EmployeeConfirmationEmail";
import MerchantPaymentReleasedEmail from "@/components/emails/MerchantPaymentReleasedEmail";
import MerchantEscrowNotification from "@/components/emails/merchant-escrow-notification";

// Validation schema
const sendMerchantEscrowNotificationSchema = z.object({
    merchantId: z.string().uuid("Invalid merchant ID"),
    transactionId: z.string().uuid("Invalid transaction ID"),
});

// Resend configuration
const resend = new Resend(process.env.RESEND_API_KEY);



/**
 * Send confirmation emails to employee and merchant
 * AC#5: Confirmation emails sent to both parties
 */
export async function sendConfirmationEmails(
    transactionId: string
): Promise<ActionResponse<void>> {
    console.log("📧 sendConfirmationEmails called with transactionId:", transactionId);

    try {
        // 1. Fetch transaction details with relations
        console.log("🔍 Fetching transaction details...");
        const transaction = await db.query.transactions.findFirst({
            where: eq(transactions.id, transactionId),
            with: {
                deal: true,
                merchant: true,
                user: true,
            },
        });

        if (!transaction || !transaction.merchant || !transaction.user) {
            console.error("❌ Transaction details not found:", {
                transaction: !!transaction,
                merchant: !!transaction?.merchant,
                user: !!transaction?.user,
            });
            return {
                success: false,
                error: "Transaction details not found.",
            };
        }

        console.log("✅ Transaction found:", {
            id: transaction.id,
            userEmail: transaction.user.email,
            merchantName: transaction.merchant.name,
        });

        const merchant = transaction.merchant;
        const user = transaction.user;
        const deal = transaction.deal;

        // 2. Parse merchant contact info
        let merchantContact: { email?: string } = {};
        try {
            merchantContact = merchant.contactInfo ? JSON.parse(merchant.contactInfo) : {};
        } catch {
            console.error("Invalid merchant contact info");
        }

        // 3. Send Employee Email
        if (user.email) {
            console.log("📨 Sending employee email to:", user.email);
            const transactionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/employee/transactions/${transaction.id}`;

            const employeeEmailHtml = await render(
                EmployeeConfirmationEmail({
                    employeeName: user.firstName || "Employee",
                    merchantName: merchant.name,
                    amount: transaction.amount,
                    transactionId: transaction.paystackReference || transaction.id,
                    transactionUrl,
                })
            );

            const employeeEmailResult = await resend.emails.send({
                from: "Stipends <onboarding@resend.dev>",
                to: user.email,
                subject: "Delivery Confirmed - Payment Released",
                html: employeeEmailHtml,
            });
            console.log("✅ Employee email sent:", employeeEmailResult);
        } else {
            console.warn("⚠️  No user email found, skipping employee email");
        }

        // 4. Send Merchant Email
        if (merchantContact.email) {
            console.log("📨 Sending merchant email to:", merchantContact.email);

            const merchantEmailHtml = await render(
                MerchantPaymentReleasedEmail({
                    merchantName: merchant.name,
                    amount: transaction.amount,
                    orderId: transaction.paystackReference || transaction.id,
                    arrivalDate: "instantly (or within 24 hours)",
                })
            );

            const merchantEmailResult = await resend.emails.send({
                from: "Stipends <onboarding@resend.dev>",
                to: merchantContact.email,
                subject: "Payment Released - Funds on the way",
                html: merchantEmailHtml,
            });
            console.log("✅ Merchant email sent:", merchantEmailResult);
        } else {
            console.warn("⚠️  No merchant email found, skipping merchant email");
        }

        console.log("✅ sendConfirmationEmails completed successfully");
        return {
            success: true,
        };

    } catch (error) {
        console.error("❌ Error sending confirmation emails:", error);
        // We don't want to fail the whole process if emails fail, just log it
        return {
            success: false,
            error: "Failed to send some emails.",
        };
    }
}



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
            from: "Stipends <onboarding@resend.dev>",
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
