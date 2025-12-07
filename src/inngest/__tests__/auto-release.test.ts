import { autoReleaseEscrow } from "../auto-release";
import { db } from "@/db";
import { transitionState } from "@/lib/escrow-state-machine";
import { releaseFundsToMerchant } from "@/server/actions/payments";

// Mock dependencies
vi.mock("@/db", () => ({
    db: {
        query: {
            escrowHolds: {
                findMany: vi.fn(),
            },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(),
            })),
        })),
    },
}));

vi.mock("@/lib/escrow-state-machine", () => ({
    transitionState: vi.fn(),
}));

vi.mock("@/server/actions/payments", () => ({
    releaseFundsToMerchant: vi.fn(),
}));

vi.mock("resend", () => ({
    Resend: class {
        emails = {
            send: () => Promise.resolve({ id: "mock-id" }),
        };
    },
}));

// Mock Inngest client to avoid actual execution issues
vi.mock("../client", () => ({
    inngest: {
        createFunction: (config: any, trigger: any, handler: any) => handler,
    },
}));

describe("Auto-Release Escrow Function", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should find and release eligible escrow holds", async () => {
        // Mock data
        const mockHold = {
            id: "hold-1",
            transactionId: "tx-1",
            amount: 5000,
            transaction: {
                id: "tx-1",
                paystackReference: "ref-1",
                user: {
                    email: "test@example.com",
                    firstName: "Test",
                },
                merchant: {
                    name: "Test Merchant",
                },
            },
        };

        // Setup mocks
        (db.query.escrowHolds.findMany as any).mockResolvedValue([mockHold]);
        (transitionState as any).mockResolvedValue({ success: true });
        (releaseFundsToMerchant as any).mockResolvedValue({ success: true });

        // Mock step.run to execute immediately
        const step = {
            run: async (name: string, fn: Function) => fn(),
        };

        // Execute function (we mocked createFunction to return the handler directly)
        const handler = autoReleaseEscrow as any;
        const result = await handler({ step });

        // Assertions
        expect(db.query.escrowHolds.findMany).toHaveBeenCalled();
        expect(transitionState).toHaveBeenCalledWith(
            "hold-1",
            "RELEASED",
            "SYSTEM",
            expect.stringContaining("Auto-release")
        );
        expect(releaseFundsToMerchant).toHaveBeenCalledWith("hold-1");
        expect(result.success).toBe(true);
        expect(result.releasedCount).toBe(1);
    });

    it("should handle empty results gracefully", async () => {
        (db.query.escrowHolds.findMany as any).mockResolvedValue([]);

        const step = {
            run: async (name: string, fn: Function) => fn(),
        };

        const handler = autoReleaseEscrow as any;
        const result = await handler({ step });

        expect(result.success).toBe(true);
        expect(result.releasedCount).toBe(0);
        expect(transitionState).not.toHaveBeenCalled();
    });

    it("should handle failures in transition", async () => {
        const mockHold = {
            id: "hold-1",
            transactionId: "tx-1",
            transaction: { user: {}, merchant: {} }
        };

        (db.query.escrowHolds.findMany as any).mockResolvedValue([mockHold]);
        (transitionState as any).mockResolvedValue({ success: false, error: "Transition failed" });

        const step = {
            run: async (name: string, fn: Function) => fn(),
        };

        const handler = autoReleaseEscrow as any;
        const result = await handler({ step });

        expect(transitionState).toHaveBeenCalled();
        expect(releaseFundsToMerchant).not.toHaveBeenCalled(); // Should skip transfer if transition fails
        expect(result.failedCount).toBe(1);
    });
});
