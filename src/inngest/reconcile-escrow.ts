import { inngest } from "./client";
import { db } from "@/db";
import { escrowHolds } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const PAYSTACK_API_URL = "https://api.paystack.co";

/**
 * Reconcile Escrow Function
 * AC#6: Verify SUM(Escrow HELD) == Paystack Balance
 * 
 * Runs daily at 3 AM WAT (West Africa Time, UTC+1)
 * - Calculates total HELD escrow from database
 * - Fetches Paystack platform balance
 * - Compares and alerts if mismatch detected
 */
export const reconcileEscrow = inngest.createFunction(
    {
        id: "reconcile-escrow",
        name: "Reconcile Escrow Balance",
    },
    {
        // Run daily at 3 AM WAT (2 AM UTC) - after auto-release at 2 AM WAT
        cron: "0 2 * * *",
    },
    async ({ step }) => {
        // Step 1: Calculate total HELD escrow
        const escrowTotal = await step.run("calculate-escrow-total", async () => {
            const result = await db
                .select({
                    total: sql<number>`COALESCE(SUM(${escrowHolds.amount}), 0)`,
                })
                .from(escrowHolds)
                .where(eq(escrowHolds.state, "HELD"));

            return result[0]?.total || 0;
        });

        // Step 2: Fetch Paystack balance
        const paystackBalance = await step.run("fetch-paystack-balance", async () => {
            const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

            if (!PAYSTACK_SECRET_KEY) {
                throw new Error("PAYSTACK_SECRET_KEY environment variable is not set");
            }

            try {
                const response = await fetch(`${PAYSTACK_API_URL}/balance`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        `Paystack API error: ${errorData.message || response.statusText}`
                    );
                }

                const data = await response.json();

                if (!data.status) {
                    throw new Error(`Paystack API failed: ${data.message}`);
                }

                // Balance is in kobo, return as-is for comparison
                return data.data.balance as number;
            } catch (error) {
                console.error("Error fetching Paystack balance:", error);
                throw error;
            }
        });

        // Step 3: Compare balances
        const reconciliationResult = await step.run("compare-balances", async () => {
            const match = escrowTotal === paystackBalance;
            const discrepancy = escrowTotal - paystackBalance;

            // Log reconciliation
            console.log("Escrow Reconciliation:", {
                escrowTotal,
                paystackBalance,
                match,
                discrepancy,
                timestamp: new Date().toISOString(),
            });

            return {
                match,
                escrowTotal,
                paystackBalance,
                discrepancy,
            };
        });

        // Step 4: Alert if mismatch
        if (!reconciliationResult.match) {
            await step.run("send-alert", async () => {
                const discrepancyNaira = (reconciliationResult.discrepancy / 100).toFixed(2);

                console.error("⚠️ ESCROW RECONCILIATION MISMATCH DETECTED", {
                    escrowTotal: reconciliationResult.escrowTotal,
                    paystackBalance: reconciliationResult.paystackBalance,
                    discrepancy: reconciliationResult.discrepancy,
                    discrepancyNaira: `₦${discrepancyNaira}`,
                });

                // Send alert email to admin
                if (process.env.ADMIN_EMAIL) {
                    try {
                        const { Resend } = await import("resend");
                        const ReconciliationAlertEmail = (await import("@/components/emails/reconciliation-alert")).default;

                        const resend = new Resend(process.env.RESEND_API_KEY);

                        await resend.emails.send({
                            from: process.env.RESEND_FROM_EMAIL || "Stipends <onboarding@resend.dev>",
                            to: process.env.ADMIN_EMAIL,
                            subject: `🚨 Escrow Reconciliation Alert: ₦${discrepancyNaira} Discrepancy`,
                            react: ReconciliationAlertEmail({
                                escrowTotal: reconciliationResult.escrowTotal,
                                paystackBalance: reconciliationResult.paystackBalance,
                                discrepancy: reconciliationResult.discrepancy,
                                timestamp: new Date().toISOString(),
                            }),
                        });

                        console.log("✅ Reconciliation alert email sent to admin");
                    } catch (emailError) {
                        console.error("❌ Failed to send reconciliation alert email:", emailError);
                    }
                }

                return {
                    alertSent: !!process.env.ADMIN_EMAIL,
                    message: process.env.ADMIN_EMAIL
                        ? "Reconciliation mismatch alert sent to admin"
                        : "Reconciliation mismatch logged (no ADMIN_EMAIL configured)",
                };
            });
        }

        return {
            success: true,
            match: reconciliationResult.match,
            escrowTotal: reconciliationResult.escrowTotal,
            paystackBalance: reconciliationResult.paystackBalance,
            discrepancy: reconciliationResult.discrepancy,
            message: reconciliationResult.match
                ? "Balances match - reconciliation successful"
                : `Mismatch detected: ₦${(reconciliationResult.discrepancy / 100).toFixed(2)} discrepancy`,
        };
    }
);
