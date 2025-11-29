"use server";

import { db } from "@/db";
import { transactions, deals, merchants, users, escrowHolds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ActionResponse } from "@/types";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

// Validation schemas
const createEscrowTransactionSchema = z.object({
    dealId: z.string().uuid("Invalid deal ID"),
    amount: z.number().positive("Amount must be positive"),
    merchantId: z.string().uuid("Invalid merchant ID"),
});

const createTransferRecipientSchema = z.object({
    merchantId: z.string().uuid("Invalid merchant ID"),
});

// Paystack API configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_API_URL = "https://api.paystack.co";

/**
 * Initialize Paystack transaction for escrow payment
 * AC#1: Full payment (100%) collected into Platform Paystack Balance
 */
export async function createEscrowTransaction(
    dealId: string,
    amount: number,
    merchantId: string
): Promise<ActionResponse<{ authorizationUrl: string; reference: string }>> {
    // 0. Input Validation
    try {
        createEscrowTransactionSchema.parse({ dealId, amount, merchantId });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.issues[0]?.message || "Invalid input",
            };
        }
    }

    // 1. Authentication
    const { userId } = await auth();
    if (!userId) {
        return {
            success: false,
            error: "Unauthorized. Please sign in.",
        };
    }

    try {
        // 2. Verify deal exists and belongs to merchant
        const deal = await db.query.deals.findFirst({
            where: eq(deals.id, dealId),
        });

        if (!deal) {
            return {
                success: false,
                error: "Deal not found.",
            };
        }

        if (deal.merchantId !== merchantId) {
            return {
                success: false,
                error: "Deal does not belong to specified merchant.",
            };
        }

        // 3. Verify merchant exists
        const merchant = await db.query.merchants.findFirst({
            where: eq(merchants.id, merchantId),
        });

        if (!merchant) {
            return {
                success: false,
                error: "Merchant not found.",
            };
        }

        // 4. Get user email for Paystack
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user || !user.email) {
            return {
                success: false,
                error: "User email not found.",
            };
        }

        // 5. Generate unique reference (transaction ID)
        const reference = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // 6. Create transaction record (PENDING state)
        const [transaction] = await db.insert(transactions).values({
            userId,
            dealId,
            merchantId,
            amount,
            type: "debit",
            status: "pending",
            paystackReference: reference,
            description: `Purchase: ${deal.title}`,
        }).returning();

        // 7. Initialize Paystack transaction
        const paystackPayload = {
            email: user.email,
            amount: amount.toString(), // Paystack expects string (in kobo)
            reference,
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/employee/checkout/callback`,
        };

        const paystackResponse = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(paystackPayload),
        });

        if (!paystackResponse.ok) {
            const errorData = await paystackResponse.json();
            console.error("Paystack API error:", errorData);

            // Rollback: Delete transaction record
            await db.delete(transactions).where(eq(transactions.id, transaction.id));

            return {
                success: false,
                error: "Payment initialization failed. Please try again.",
            };
        }

        const paystackData = await paystackResponse.json();

        if (!paystackData.status || !paystackData.data?.authorization_url) {
            // Rollback: Delete transaction record
            await db.delete(transactions).where(eq(transactions.id, transaction.id));

            return {
                success: false,
                error: "Invalid response from payment provider.",
            };
        }

        return {
            success: true,
            data: {
                authorizationUrl: paystackData.data.authorization_url,
                reference,
            },
        };

    } catch (error) {
        console.error("Error creating escrow transaction:", error);
        return {
            success: false,
            error: "An unexpected error occurred.",
        };
    }
}

/**
 * Create Paystack Transfer Recipient for merchant
 * AC#1: Transfer Recipient management for future fund releases
 */
export async function createTransferRecipient(
    merchantId: string
): Promise<ActionResponse<{ recipientCode: string }>> {
    // 0. Input Validation
    try {
        createTransferRecipientSchema.parse({ merchantId });
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

        // 2. Check if recipient already exists
        if (merchant.paystackRecipientCode) {
            return {
                success: true,
                data: {
                    recipientCode: merchant.paystackRecipientCode,
                },
            };
        }

        // 3. Parse merchant contact info (should contain bank details)
        let bankDetails: { account_number?: string; bank_code?: string };
        try {
            bankDetails = merchant.contactInfo ? JSON.parse(merchant.contactInfo) : {};
        } catch {
            return {
                success: false,
                error: "Invalid merchant contact information.",
            };
        }

        if (!bankDetails.account_number || !bankDetails.bank_code) {
            return {
                success: false,
                error: "Merchant bank details not configured.",
            };
        }

        // 4. Create Transfer Recipient via Paystack API
        const recipientPayload = {
            type: "nuban",
            name: merchant.name,
            account_number: bankDetails.account_number,
            bank_code: bankDetails.bank_code,
            currency: "NGN",
        };

        const paystackResponse = await fetch(`${PAYSTACK_API_URL}/transferrecipient`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(recipientPayload),
        });

        if (!paystackResponse.ok) {
            const errorData = await paystackResponse.json();
            console.error("Paystack Transfer Recipient API error:", errorData);
            return {
                success: false,
                error: "Failed to create transfer recipient.",
            };
        }

        const paystackData = await paystackResponse.json();

        if (!paystackData.status || !paystackData.data?.recipient_code) {
            return {
                success: false,
                error: "Invalid response from payment provider.",
            };
        }

        const recipientCode = paystackData.data.recipient_code;

        // 5. Store recipient code in database
        await db.update(merchants)
            .set({ paystackRecipientCode: recipientCode })
            .where(eq(merchants.id, merchantId));

        return {
            success: true,
            data: {
                recipientCode,
            },
        };

    } catch (error) {
        console.error("Error creating transfer recipient:", error);
        return {
            success: false,
            error: "An unexpected error occurred.",
        };
    }
}

const releaseFundsToMerchantSchema = z.object({
    escrowHoldId: z.string().uuid("Invalid escrow hold ID"),
});

/**
 * Release funds to merchant via Paystack Transfer
 * AC#4: Transfer funds from Platform Balance to Merchant Account
 */
export async function releaseFundsToMerchant(
    escrowHoldId: string
): Promise<ActionResponse<{ transferCode: string; reference: string }>> {
    // 0. Input Validation
    try {
        releaseFundsToMerchantSchema.parse({ escrowHoldId });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.issues[0]?.message || "Invalid input",
            };
        }
    }

    try {
        // 1. Fetch escrow hold and related data
        const hold = await db.query.escrowHolds.findFirst({
            where: eq(escrowHolds.id, escrowHoldId),
            with: {
                transaction: {
                    with: {
                        merchant: true,
                    },
                },
            },
        });

        if (!hold || !hold.transaction || !hold.transaction.merchant) {
            return {
                success: false,
                error: "Escrow hold or merchant details not found.",
            };
        }

        const merchant = hold.transaction.merchant;
        const amount = hold.amount; // Amount in kobo

        // 2. Ensure merchant has a recipient code
        let recipientCode = merchant.paystackRecipientCode;

        if (!recipientCode) {
            // Attempt to create one on the fly
            const recipientResult = await createTransferRecipient(merchant.id);
            if (!recipientResult.success || !recipientResult.data) {
                return {
                    success: false,
                    error: recipientResult.error || "Failed to create transfer recipient for merchant.",
                };
            }
            recipientCode = recipientResult.data.recipientCode;
        }

        // 3. Initiate Transfer
        // Idempotency: Use escrowHoldId as the reference
        const transferPayload = {
            source: "balance",
            amount: amount,
            recipient: recipientCode,
            reason: `Escrow release for transaction ${hold.transaction.paystackReference || hold.transactionId}`,
            reference: escrowHoldId,
        };

        const paystackResponse = await fetch(`${PAYSTACK_API_URL}/transfer`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(transferPayload),
        });

        if (!paystackResponse.ok) {
            const errorData = await paystackResponse.json();
            console.error("Paystack Transfer API error:", errorData);

            // Handle specific error: Insufficient balance
            if (errorData.message?.includes("balance")) {
                return {
                    success: false,
                    error: "Transfer failed: Insufficient platform balance. Admin notified.",
                };
            }

            return {
                success: false,
                error: `Transfer failed: ${errorData.message || "Unknown error"}`,
            };
        }

        const paystackData = await paystackResponse.json();

        if (!paystackData.status) {
            return {
                success: false,
                error: `Transfer failed: ${paystackData.message}`,
            };
        }

        return {
            success: true,
            data: {
                transferCode: paystackData.data.transfer_code,
                reference: paystackData.data.reference,
            },
        };

    } catch (error) {
        console.error("Error releasing funds:", error);
        return {
            success: false,
            error: "An unexpected error occurred during fund transfer.",
        };
    }
}
