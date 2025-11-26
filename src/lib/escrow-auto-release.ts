import { db } from "@/db";
import { escrowHolds } from "@/db/schema";
import { eq, and, lt, not } from "drizzle-orm";
import { transitionState } from "./escrow-state-machine";

/**
 * Finds all escrow holds that have been HELD for more than 7 days
 * and are not currently disputed.
 */
export async function findExpiredHolds(): Promise<string[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const expiredHolds = await db.query.escrowHolds.findMany({
        where: and(
            eq(escrowHolds.state, "HELD"),
            lt(escrowHolds.heldAt, sevenDaysAgo)
        ),
        columns: {
            id: true,
        },
    });

    return expiredHolds.map((h) => h.id);
}

/**
 * Processes a list of expired escrow hold IDs and releases them.
 * Logs errors but continues processing.
 */
export async function releaseExpiredHolds(escrowHoldIds: string[]): Promise<void> {
    for (const holdId of escrowHoldIds) {
        try {
            const result = await transitionState(
                holdId,
                "RELEASED",
                "SYSTEM",
                "Auto-release after 7 days"
            );

            if (!result.success) {
                console.error(`Failed to auto-release hold ${holdId}: ${result.error}`);
            }
        } catch (error) {
            console.error(`Exception during auto-release of hold ${holdId}:`, error);
        }
    }
}
