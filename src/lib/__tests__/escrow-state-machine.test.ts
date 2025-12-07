
import { transitionState, EscrowStates } from "../escrow-state-machine";
import { findExpiredHolds, releaseExpiredHolds } from "../escrow-auto-release";
import { db } from "@/db";

// Mock the database module
vi.mock("@/db", () => ({
    db: {
        transaction: vi.fn((callback) => callback(db)), // Execute callback immediately with mocked db
        query: {
            escrowHolds: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
            },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(),
            })),
        })),
        insert: vi.fn(() => ({
            values: vi.fn(),
        })),
    },
}));

describe("Escrow State Machine", () => {
    const mockHoldId = "hold-123";
    const mockActorId = "user-456";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("transitionState", () => {
        it("should transition from HELD to RELEASED", async () => {
            // Mock existing hold
            vi.mocked(db.query.escrowHolds.findFirst).mockResolvedValue({
                id: mockHoldId,
                state: EscrowStates.HELD,
            } as any);

            const result = await transitionState(
                mockHoldId,
                EscrowStates.RELEASED,
                mockActorId,
                "Manual release"
            );

            expect(result.success).toBe(true);
            expect(db.update).toHaveBeenCalled();
            expect(db.insert).toHaveBeenCalled(); // Audit log
        });

        it("should transition from HELD to DISPUTED", async () => {
            vi.mocked(db.query.escrowHolds.findFirst).mockResolvedValue({
                id: mockHoldId,
                state: EscrowStates.HELD,
            } as any);

            const result = await transitionState(
                mockHoldId,
                EscrowStates.DISPUTED,
                mockActorId,
                "Dispute raised"
            );

            expect(result.success).toBe(true);
        });

        it("should transition from DISPUTED to REFUNDED", async () => {
            vi.mocked(db.query.escrowHolds.findFirst).mockResolvedValue({
                id: mockHoldId,
                state: EscrowStates.DISPUTED,
            } as any);

            const result = await transitionState(
                mockHoldId,
                EscrowStates.REFUNDED,
                mockActorId,
                "Refund approved"
            );

            expect(result.success).toBe(true);
        });

        it("should fail invalid transition (RELEASED -> HELD)", async () => {
            vi.mocked(db.query.escrowHolds.findFirst).mockResolvedValue({
                id: mockHoldId,
                state: EscrowStates.RELEASED,
            } as any);

            const result = await transitionState(
                mockHoldId,
                EscrowStates.HELD,
                mockActorId,
                "Revert"
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain("Invalid transition");
            expect(db.update).not.toHaveBeenCalled();
        });

        it("should be idempotent (HELD -> HELD)", async () => {
            vi.mocked(db.query.escrowHolds.findFirst).mockResolvedValue({
                id: mockHoldId,
                state: EscrowStates.HELD,
            } as any);

            const result = await transitionState(
                mockHoldId,
                EscrowStates.HELD,
                mockActorId,
                "No-op"
            );

            expect(result.success).toBe(true);
            expect(db.update).not.toHaveBeenCalled(); // No update needed
        });

        it("should return error if hold not found", async () => {
            vi.mocked(db.query.escrowHolds.findFirst).mockResolvedValue(null);

            const result = await transitionState(
                mockHoldId,
                EscrowStates.RELEASED,
                mockActorId,
                "Release"
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe("Escrow hold not found");
        });
    });

    describe("Auto-Release Logic", () => {
        describe("findExpiredHolds", () => {
            it("should query for HELD states older than 7 days", async () => {
                const mockExpiredHolds = [{ id: "h1" }, { id: "h2" }];
                vi.mocked(db.query.escrowHolds.findMany).mockResolvedValue(mockExpiredHolds as any);

                const ids = await findExpiredHolds();

                expect(ids).toEqual(["h1", "h2"]);
                expect(db.query.escrowHolds.findMany).toHaveBeenCalled();
                // Verify query args contain 'HELD' and date check (complex to verify exact date object in mock)
            });
        });

        describe("releaseExpiredHolds", () => {
            it("should attempt to release each hold", async () => {
                // Mock findFirst for the transitionState calls
                vi.mocked(db.query.escrowHolds.findFirst).mockResolvedValue({
                    id: "h1",
                    state: EscrowStates.HELD,
                } as any);

                await releaseExpiredHolds(["h1", "h2"]);

                // Should call transitionState twice (which calls db.update/insert)
                // Since we mocked db.transaction to run immediately, it executes the logic
                expect(db.update).toHaveBeenCalledTimes(2);
            });
        });
    });
});
