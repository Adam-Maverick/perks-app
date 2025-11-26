import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createEscrowHold } from "@/server/actions/escrow";
import { sendMerchantEscrowNotification } from "@/server/actions/notifications";
import crypto from "crypto";

/**
 * Paystack Webhook Handler
 * AC#5: Paystack webhook updates transaction status on charge.success
 * AC#6: If payment fails, no escrow record is created
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Get webhook payload
        const body = await request.text();
        const signature = request.headers.get("x-paystack-signature");

        // 2. Verify webhook signature (MANDATORY for security)
        if (!signature) {
            console.error("Webhook signature missing");
            return NextResponse.json(
                { error: "Signature missing" },
                { status: 400 }
            );
        }

        const hash = crypto
            .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
            .update(body)
            .digest("hex");

        if (hash !== signature) {
            console.error("Invalid webhook signature");
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 400 }
            );
        }

        // 3. Parse webhook payload
        const event = JSON.parse(body);

        // 4. Handle different event types
        switch (event.event) {
            case "charge.success":
                await handleChargeSuccess(event.data);
                break;

            case "charge.failed":
                await handleChargeFailed(event.data);
                break;

            default:
                console.log(`Unhandled webhook event: ${event.event}`);
        }

        // 5. Return 200 OK to acknowledge receipt
        return NextResponse.json({ status: "success" });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}

/**
 * Handle successful charge event
 * AC#5: Update transaction status, create escrow hold, notify merchant
 */
async function handleChargeSuccess(data: any) {
    const reference = data.reference;

    try {
        // 1. Find transaction by Paystack reference
        const transaction = await db.query.transactions.findFirst({
            where: eq(transactions.paystackReference, reference),
        });

        if (!transaction) {
            console.error(`Transaction not found for reference: ${reference}`);
            return;
        }

        // 2. Idempotency check: Skip if already processed
        if (transaction.status === "completed" && transaction.escrowHoldId) {
            console.log(`Transaction ${reference} already processed`);
            return;
        }

        // 3. Update transaction status to completed
        await db.update(transactions)
            .set({ status: "completed" })
            .where(eq(transactions.id, transaction.id));

        // 4. Create escrow hold (AC#2)
        if (!transaction.merchantId) {
            console.error(`No merchant ID for transaction: ${reference}`);
            return;
        }

        const escrowResult = await createEscrowHold(
            transaction.id,
            transaction.merchantId,
            transaction.amount
        );

        if (!escrowResult.success) {
            console.error(`Failed to create escrow hold: ${escrowResult.error}`);
            return;
        }

        // 5. Send merchant notification (AC#3)
        const notificationResult = await sendMerchantEscrowNotification(
            transaction.merchantId,
            transaction.id
        );

        if (!notificationResult.success) {
            console.error(`Failed to send merchant notification: ${notificationResult.error}`);
            // Don't fail the webhook - notification is not critical
        }

        console.log(`Successfully processed charge.success for ${reference}`);

    } catch (error) {
        console.error(`Error handling charge.success for ${reference}:`, error);
        throw error; // Re-throw to trigger webhook retry
    }
}

/**
 * Handle failed charge event
 * AC#6: If payment fails, no escrow record is created
 */
async function handleChargeFailed(data: any) {
    const reference = data.reference;

    try {
        // 1. Find transaction by Paystack reference
        const transaction = await db.query.transactions.findFirst({
            where: eq(transactions.paystackReference, reference),
        });

        if (!transaction) {
            console.error(`Transaction not found for reference: ${reference}`);
            return;
        }

        // 2. Idempotency check: Skip if already marked as failed
        if (transaction.status === "failed") {
            console.log(`Transaction ${reference} already marked as failed`);
            return;
        }

        // 3. Update transaction status to failed
        await db.update(transactions)
            .set({ status: "failed" })
            .where(eq(transactions.id, transaction.id));

        // 4. DO NOT create escrow hold (AC#6)
        console.log(`Transaction ${reference} marked as failed. No escrow created.`);

        // TODO: Send failure notification to user (future story)

    } catch (error) {
        console.error(`Error handling charge.failed for ${reference}:`, error);
        throw error; // Re-throw to trigger webhook retry
    }
}
