import { inngest } from "./client";
import { db } from "@/db";
import { escrowHolds, transactions } from "@/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { transitionState } from "@/lib/escrow-state-machine";
import { releaseFundsToMerchant } from "@/server/actions/payments";
import { Resend } from "resend";
import EscrowAutoReleasedEmail from "@/components/emails/escrow-auto-released";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Auto-Release Escrow Function
 * AC#1, AC#2, AC#4: Automatically release escrow after 14 days
 * 
 * Runs daily at 2 AM WAT (West Africa Time, UTC+1)
 * - Queries escrow holds in HELD state for 14+ days
 * - Transitions state to RELEASED
 * - Triggers Paystack Transfer to merchant
 * - Updates transaction status to AUTO_COMPLETED
 * - Sends notification email to employee
 */
export const autoReleaseEscrow = inngest.createFunction(
    {
        id: "auto-release-escrow",
        name: "Auto-Release Escrow After 14 Days",
        retries: 3,
        onFailure: async ({ error, event }) => {
            console.error("Auto-release function failed after retries:", error);
        },
    },
    { cron: "0 1 * * *" },
    async ({ step }) => {
        // Step 1: Query eligible escrow holds
        const eligibleHolds = await step.run("query-eligible-holds", async () => {
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

            return await db.query.escrowHolds.findMany({
                where: and(
                    eq(escrowHolds.state, "HELD"),
                    lt(escrowHolds.heldAt, fourteenDaysAgo)
                ),
                with: {
                    transaction: {
                        with: {
                            user: true,
                            merchant: true,
                        },
                    },
                },
            });
        });

        if (eligibleHolds.length === 0) {
            return {
                success: true,
                message: "No escrow holds eligible for auto-release",
                releasedCount: 0,
            };
        }

        // Step 2: Process each hold
        const results = await step.run("process-releases", async () => {
            const released: string[] = [];
            const failed: Array<{ holdId: string; error: string }> = [];

            for (const hold of eligibleHolds) {
                try {
                    // Transition state: HELD → RELEASED
                    const transitionResult = await transitionState(
                        hold.id,
                        "RELEASED",
                        "SYSTEM",
                        "Auto-release after 14 days"
                    );

                    if (!transitionResult.success) {
                        failed.push({
                            holdId: hold.id,
                            error: transitionResult.error || "State transition failed",
                        });
                        continue;
                    }

                    // Trigger Paystack Transfer
                    const transferResult = await releaseFundsToMerchant(hold.id);

                    if (!transferResult.success) {
                        // Log error but don't rollback state transition
                        // Transfer can be retried manually
                        console.error(
                            `Transfer failed for hold ${hold.id}:`,
                            transferResult.error
                        );
                        failed.push({
                            holdId: hold.id,
                            error: `Transfer failed: ${transferResult.error}`,
                        });
                        continue;
                    }

                    // Update transaction status to auto_completed
                    if (hold.transaction) {
                        await db
                            .update(transactions)
                            .set({
                                status: "auto_completed",
                            })
                            .where(eq(transactions.id, hold.transactionId));
                    }

                    released.push(hold.id);

                    // Send notification email to employee (AC#3)
                    if (hold.transaction?.user?.email && hold.transaction.merchant) {
                        try {
                            const transactionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/employee/transactions/${hold.transactionId}`;

                            await resend.emails.send({
                                from: process.env.RESEND_FROM_EMAIL || "Stipends <onboarding@resend.dev>",
                                to: hold.transaction.user.email,
                                subject: `Auto-Release: Transaction with ${hold.transaction.merchant.name} Completed`,
                                react: EscrowAutoReleasedEmail({
                                    employeeName: hold.transaction.user.firstName || "Employee",
                                    merchantName: hold.transaction.merchant.name,
                                    amount: hold.amount,
                                    transactionId: hold.transaction.paystackReference || hold.transactionId,
                                    transactionUrl,
                                }),
                            });
                            console.log(`Auto-release email sent for hold ${hold.id}`);
                        } catch (emailError) {
                            console.error(`Failed to send email for hold ${hold.id}:`, emailError);
                            // Don't fail the job just because email failed
                        }
                    }

                } catch (error) {
                    console.error(`Error processing hold ${hold.id}:`, error);
                    failed.push({
                        holdId: hold.id,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                }
            }

            return { released, failed };
        });

        // Step 3: Log results
        console.log(
            `Auto-release completed: ${results.released.length} released, ${results.failed.length} failed`
        );

        if (results.failed.length > 0) {
            console.error("Failed releases:", results.failed);
        }

        return {
            success: true,
            message: `Auto-released ${results.released.length} escrow holds`,
            releasedCount: results.released.length,
            failedCount: results.failed.length,
            failures: results.failed,
        };
    }
);
