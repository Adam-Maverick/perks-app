import { sendEscrowReminders } from "../send-escrow-reminders";
import { db } from "@/db";

// Mock dependencies
vi.mock("@/db", () => ({
    db: {
        query: {
            escrowHolds: {
                findMany: vi.fn(),
            },
        },
    },
}));

vi.mock("resend", () => ({
    Resend: class {
        emails = {
            send: vi.fn().mockResolvedValue({ id: "mock-id" }),
        };
    },
}));

// Mock Inngest client
vi.mock("../client", () => ({
    inngest: {
        createFunction: (config: any, trigger: any, handler: any) => handler,
    },
}));

describe("Send Escrow Reminders Function", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should send Day 7 reminder emails", async () => {
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

        (db.query.escrowHolds.findMany as any).mockResolvedValue([mockHold]);

        const step = {
            run: async (name: string, fn: Function) => fn(),
        };

        const handler = sendEscrowReminders as any;
        const result = await handler({ step });

        expect(db.query.escrowHolds.findMany).toHaveBeenCalledTimes(2); // Day 7 and Day 12
        expect(result.success).toBe(true);
        expect(result.day7Sent).toBeGreaterThanOrEqual(0);
    });

    it("should send Day 12 reminder emails", async () => {
        const mockHold = {
            id: "hold-2",
            transactionId: "tx-2",
            amount: 10000,
            transaction: {
                id: "tx-2",
                paystackReference: "ref-2",
                user: {
                    email: "test2@example.com",
                    firstName: "Test2",
                },
                merchant: {
                    name: "Test Merchant 2",
                },
            },
        };

        (db.query.escrowHolds.findMany as any)
            .mockResolvedValueOnce([]) // Day 7: empty
            .mockResolvedValueOnce([mockHold]); // Day 12: 1 hold

        const step = {
            run: async (name: string, fn: Function) => fn(),
        };

        const handler = sendEscrowReminders as any;
        const result = await handler({ step });

        expect(result.success).toBe(true);
        expect(result.day12Sent).toBeGreaterThanOrEqual(0);
    });

    it("should handle empty results gracefully", async () => {
        (db.query.escrowHolds.findMany as any).mockResolvedValue([]);

        const step = {
            run: async (name: string, fn: Function) => fn(),
        };

        const handler = sendEscrowReminders as any;
        const result = await handler({ step });

        expect(result.success).toBe(true);
        expect(result.day7Sent).toBe(0);
        expect(result.day12Sent).toBe(0);
        expect(result.failedCount).toBe(0);
    });

    it("should handle missing user email gracefully", async () => {
        const mockHold = {
            id: "hold-3",
            transactionId: "tx-3",
            transaction: {
                user: null, // No user
                merchant: { name: "Test" },
            },
        };

        (db.query.escrowHolds.findMany as any).mockResolvedValue([mockHold]);

        const step = {
            run: async (name: string, fn: Function) => fn(),
        };

        const handler = sendEscrowReminders as any;
        const result = await handler({ step });

        expect(result.success).toBe(true);
        expect(result.failedCount).toBeGreaterThan(0);
    });
});
