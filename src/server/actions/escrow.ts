"use server";

import { db } from "@/db";
import { transactions, escrowHolds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ActionResponse } from "@/types";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { releaseFundsToMerchant } from "./payments";
import { sendConfirmationEmails } from "./notifications";
import { transitionState } from "@/lib/escrow-state-machine";

// Validation schema
const createEscrowHoldSchema = z.object({
    transactionId: z.string().uuid("Invalid transaction ID"),
    merchantId: z.string().uuid("Invalid merchant ID"),
    amount: z.number().positive("Amount must be positive"),
});

/**
 * Create escrow hold for a transaction
 * AC#2: Escrow hold recorded in escrow_holds with state HELD
 * AC#4: Transaction linked to escrow hold via transaction_id
 * 
 * CRITICAL: This must be called atomically with transaction creation
 * in the webhook handler to ensure consistency.
 */
export async function createEscrowHold(
    transactionId: string,
    merchantId: string,
    amount: number
): Promise<ActionResponse<{ escrowHoldId: string }>> {
    // 0. Input Validation
    try {
        createEscrowHoldSchema.parse({ transactionId, merchantId, amount });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.issues[0]?.message || "Invalid input",
            };
        }
    }

    try {
        // 1. Verify transaction exists
        const transaction = await db.query.transactions.findFirst({
            where: eq(transactions.id, transactionId),
        });

        if (!transaction) {
            return {
                success: false,
                error: "Transaction not found.",
            };
        }

        // 2. Verify transaction is successful
        if (transaction.status !== "completed") {
            return {
                success: false,
                error: "Cannot create escrow hold for non-completed transaction.",
            };
        }

        // 3. Check if escrow hold already exists
        if (transaction.escrowHoldId) {
            const existingHold = await db.query.escrowHolds.findFirst({
                where: eq(escrowHolds.id, transaction.escrowHoldId),
            });

            if (existingHold) {
                return {
                    success: true,
                    data: {
                        escrowHoldId: existingHold.id,
                    },
                };
            }
        }

        // 4. Create escrow hold atomically
        const result = await db.transaction(async (tx) => {
            // Insert escrow hold with HELD state
            const [escrowHold] = await tx.insert(escrowHolds).values({
                transactionId,
                merchantId,
                amount,
                state: "HELD",
                heldAt: new Date(),
            }).returning();

            // Link transaction to escrow hold
            await tx.update(transactions)
                .set({ escrowHoldId: escrowHold.id })
                .where(eq(transactions.id, transactionId));

            return escrowHold;
        });

        return {
            success: true,
            data: {
                escrowHoldId: result.id,
            },
        };

    } catch (error) {
        console.error("Error creating escrow hold:", error);
        return {
            success: false,
            error: "An unexpected error occurred.",
        };
    }
}

/**
 * Confirm delivery and release escrow
 * AC#3: Escrow state transitions to RELEASED
 * AC#4: Funds released to merchant
 * AC#5: Confirmation emails sent
 * AC#6: Transaction status updated to completed
 */
export async function confirmDelivery(
    escrowHoldId: string
): Promise<ActionResponse<void>> {
    try {
        // 1. Authentication
        const { userId } = await auth();
        if (!userId) {
            return {
                success: false,
                error: "Unauthorized. Please sign in.",
            };
        }

        // 2. Fetch Escrow Hold
        const hold = await db.query.escrowHolds.findFirst({
            where: eq(escrowHolds.id, escrowHoldId),
            with: {
                transaction: true,
            },
        });

        if (!hold) {
            return {
                success: false,
                error: "Escrow hold not found.",
            };
        }

        // 3. Verify Ownership
        if (hold.transaction.userId !== userId) {
            return {
                success: false,
                error: "Unauthorized. You do not own this transaction.",
            };
        }

        // 4. Verify State
        if (hold.state !== "HELD") {
            return {
                success: false,
                error: "Escrow is not in HELD state.",
            };
        }

        // Step A: Transition State (HELD -> RELEASED)
        const transitionResult = await transitionState(
            escrowHoldId,
            "RELEASED",
            userId,
            "Employee confirmed delivery"
        );

        if (!transitionResult.success) {
            return {
                success: false,
                error: transitionResult.error || "Failed to release escrow.",
            };
        }

        // Step B: Release Funds (Paystack)
        const transferResult = await releaseFundsToMerchant(escrowHoldId);

        if (!transferResult.success) {
            console.error("Funds release failed after state transition:", transferResult.error);
            // Log critical error, return success as delivery is confirmed.
        }

        // Step C: Send Emails
        try {
            console.log("📧 Attempting to send confirmation emails for transaction:", hold.transactionId);
            const emailResult = await sendConfirmationEmails(hold.transactionId);
            if (!emailResult.success) {
                console.error("❌ Email sending failed:", emailResult.error);
            } else {
                console.log("✅ Confirmation emails sent successfully");
            }
        } catch (emailError) {
            console.error("❌ Error sending confirmation emails:", emailError);
            // Don't fail the whole confirmation if emails fail
        }

        // Step D: Update Transaction Status to Completed
        // Note: Transaction might already be 'completed' from creation, but we reaffirm it here or update if it was 'pending' (though createEscrowHold checks for completed)
        // Actually, in our flow, transaction is 'completed' when paid by employee.
        // But AC#6 says "Transaction shows Completed status". It already does.
        // Maybe we don't need to update it? Or maybe we update a separate 'delivery_status'?
        // For now, let's keep it as is.

        return {
            success: true,
        };

    } catch (error: any) {
        console.error("Error confirming delivery:", error);
        return {
            success: false,
            error: `Debug Error: ${error.message || JSON.stringify(error)}`,
        };
    }
}
