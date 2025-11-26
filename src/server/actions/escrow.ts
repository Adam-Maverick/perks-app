"use server";

import { db } from "@/db";
import { transactions, escrowHolds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ActionResponse } from "@/types";
import { z } from "zod";

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
