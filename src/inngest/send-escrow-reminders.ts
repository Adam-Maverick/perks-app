import { inngest } from "./client";
import { db } from "@/db";
import { escrowHolds } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Resend } from "resend";
import EscrowReminderDay7Email from "@/components/emails/escrow-reminder-day-7";
import EscrowReminderDay12Email from "@/components/emails/escrow-reminder-day-12";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send Escrow Reminders Function
 * AC#5: Send reminder emails on Day 7 and Day 12
 * 
 * Runs daily at 10 AM WAT (West Africa Time, UTC+1)
 * - Queries escrow holds that are exactly 7 days old
 * - Queries escrow holds that are exactly 12 days old
 * - Sends reminder emails to employees
 */
export const sendEscrowReminders = inngest.createFunction(
    {
        id: "send-escrow-reminders",
        name: "Send Escrow Reminder Emails",
    },
    {
        // Run daily at 10 AM WAT (9 AM UTC)
        cron: "0 9 * * *",
    },
    async ({ step }) => {
        // Step 1: Query Day 7 reminders
        const day7Reminders = await step.run("query-day-7-reminders", async () => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            const eightDaysAgo = new Date();
            eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
            eightDaysAgo.setHours(0, 0, 0, 0);

            return await db.query.escrowHolds.findMany({
                where: and(
                    eq(escrowHolds.state, "HELD"),
                    sql`DATE(${escrowHolds.heldAt}) = DATE(${sevenDaysAgo})`
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

        // Step 2: Query Day 12 reminders
        const day12Reminders = await step.run("query-day-12-reminders", async () => {
            const twelveDaysAgo = new Date();
            twelveDaysAgo.setDate(twelveDaysAgo.getDate() - 12);
            twelveDaysAgo.setHours(0, 0, 0, 0);

            return await db.query.escrowHolds.findMany({
                where: and(
                    eq(escrowHolds.state, "HELD"),
                    sql`DATE(${escrowHolds.heldAt}) = DATE(${twelveDaysAgo})`
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

        // Step 3: Send Day 7 reminder emails
        const day7Results = await step.run("send-day-7-emails", async () => {
            const sent: string[] = [];
            const failed: Array<{ holdId: string; error: string }> = [];

            for (const hold of day7Reminders) {
                try {
                    if (!hold.transaction?.user?.email) {
                        failed.push({
                            holdId: hold.id,
                            error: "User email not found",
                        });
                        continue;
                    }

                    const transactionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/employee/transactions/${hold.transactionId}`;

                    await resend.emails.send({
                        from: process.env.RESEND_FROM_EMAIL || "Stipends <onboarding@resend.dev>",
                        to: hold.transaction.user.email,
                        subject: `Action Required: Confirm Delivery from ${hold.transaction.merchant.name}`,
                        react: EscrowReminderDay7Email({
                            employeeName: hold.transaction.user.firstName || "Employee",
                            merchantName: hold.transaction.merchant.name,
                            amount: hold.amount,
                            transactionId: hold.transaction.paystackReference || hold.transactionId,
                            transactionUrl,
                        }),
                    });

                    sent.push(hold.id);
                    console.log(`Day 7 reminder sent for hold ${hold.id}`);
                } catch (error) {
                    console.error(`Error sending Day 7 reminder for hold ${hold.id}:`, error);
                    failed.push({
                        holdId: hold.id,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                }
            }

            return { sent, failed };
        });

        // Step 4: Send Day 12 reminder emails
        const day12Results = await step.run("send-day-12-emails", async () => {
            const sent: string[] = [];
            const failed: Array<{ holdId: string; error: string }> = [];

            for (const hold of day12Reminders) {
                try {
                    if (!hold.transaction?.user?.email) {
                        failed.push({
                            holdId: hold.id,
                            error: "User email not found",
                        });
                        continue;
                    }

                    const transactionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/employee/transactions/${hold.transactionId}`;

                    await resend.emails.send({
                        from: process.env.RESEND_FROM_EMAIL || "Stipends <onboarding@resend.dev>",
                        to: hold.transaction.user.email,
                        subject: `URGENT: Final Reminder to Confirm Delivery from ${hold.transaction.merchant.name}`,
                        react: EscrowReminderDay12Email({
                            employeeName: hold.transaction.user.firstName || "Employee",
                            merchantName: hold.transaction.merchant.name,
                            amount: hold.amount,
                            transactionId: hold.transaction.paystackReference || hold.transactionId,
                            transactionUrl,
                        }),
                    });

                    sent.push(hold.id);
                    console.log(`Day 12 reminder sent for hold ${hold.id}`);
                } catch (error) {
                    console.error(`Error sending Day 12 reminder for hold ${hold.id}:`, error);
                    failed.push({
                        holdId: hold.id,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                }
            }

            return { sent, failed };
        });

        // Step 5: Log results
        const totalSent = day7Results.sent.length + day12Results.sent.length;
        const totalFailed = day7Results.failed.length + day12Results.failed.length;

        console.log(
            `Reminder emails: ${totalSent} sent (${day7Results.sent.length} Day 7, ${day12Results.sent.length} Day 12), ${totalFailed} failed`
        );

        return {
            success: true,
            message: `Sent ${totalSent} reminder emails`,
            day7Sent: day7Results.sent.length,
            day12Sent: day12Results.sent.length,
            failedCount: totalFailed,
        };
    }
);
