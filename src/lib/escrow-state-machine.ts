import { db } from "@/db";
import { escrowHolds, escrowAuditLog, escrowStateEnum } from "@/db/schema";
import { eq } from "drizzle-orm";

// Re-export the enum for use in application logic
export type EscrowState = (typeof escrowStateEnum.enumValues)[number];
export const EscrowStates = {
    HELD: "HELD",
    RELEASED: "RELEASED",
    DISPUTED: "DISPUTED",
    REFUNDED: "REFUNDED",
} as const;

type TransitionResult = {
    success: boolean;
    error?: string;
};

/**
 * Validates if a state transition is allowed based on business rules.
 */
function isValidTransition(from: EscrowState, to: EscrowState): boolean {
    switch (from) {
        case "HELD":
            return to === "RELEASED" || to === "DISPUTED";
        case "DISPUTED":
            return to === "RELEASED" || to === "REFUNDED";
        case "RELEASED":
        case "REFUNDED":
            return false; // Final states
        default:
            return false;
    }
}

/**
 * Transitions an escrow hold to a new state with audit logging.
 * Handles idempotency and atomic updates.
 */
export async function transitionState(
    escrowHoldId: string,
    toState: EscrowState,
    actorId: string,
    reason: string
): Promise<TransitionResult> {
    try {
        return await db.transaction(async (tx) => {
            // 1. Fetch current state
            // Note: In a high-concurrency environment, we might want "FOR UPDATE" locking here.
            // For now, we rely on the atomic transaction and state check.
            const hold = await tx.query.escrowHolds.findFirst({
                where: eq(escrowHolds.id, escrowHoldId),
            });

            if (!hold) {
                return { success: false, error: "Escrow hold not found" };
            }

            // 2. Idempotency Check
            if (hold.state === toState) {
                return { success: true }; // Already in target state, treat as success
            }

            // 3. Validate Transition
            if (!isValidTransition(hold.state, toState)) {
                return {
                    success: false,
                    error: `Invalid transition from ${hold.state} to ${toState}`,
                };
            }

            // 4. Update State
            const updateData: Partial<typeof escrowHolds.$inferInsert> = {
                state: toState,
                updatedAt: new Date(),
            };

            if (toState === "RELEASED") {
                updateData.releasedAt = new Date();
            }

            await tx
                .update(escrowHolds)
                .set(updateData)
                .where(eq(escrowHolds.id, escrowHoldId));

            // 5. Create Audit Log
            await tx.insert(escrowAuditLog).values({
                escrowHoldId: escrowHoldId,
                fromState: hold.state,
                toState: toState,
                actorId: actorId,
                reason: reason,
            });

            return { success: true };
        });
    } catch (error) {
        console.error("Escrow transition error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
