import { reconcileEscrow } from "../reconcile-escrow";
import { db } from "@/db";

// Mock dependencies
vi.mock("@/db", () => ({
    db: {
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve([{ total: 500000 }])),
            })),
        })),
    },
}));

// Mock fetch for Paystack API
global.fetch = vi.fn();

// Mock Inngest client
vi.mock("../client", () => ({
    inngest: {
        createFunction: (config: any, trigger: any, handler: any) => handler,
    },
}));

vi.mock("resend", () => ({
    Resend: class {
        emails = {
            send: vi.fn().mockResolvedValue({ id: "mock-id" }),
        };
    },
}));

describe("Reconcile Escrow Function", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.PAYSTACK_SECRET_KEY = "test-secret-key";
    });

    it("should reconcile matching balances successfully", async () => {
        // Mock Paystack API response
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                status: true,
                data: { balance: 500000 }, // Matches escrow total
            }),
        });

        const step = {
            run: async (name: string, fn: Function) => fn(),
        };

        const handler = reconcileEscrow as any;
        const result = await handler({ step });

        expect(result.success).toBe(true);
        expect(result.match).toBe(true);
        expect(result.escrowTotal).toBe(500000);
        expect(result.paystackBalance).toBe(500000);
        expect(result.discrepancy).toBe(0);
    });

    it("should detect balance mismatch and alert", async () => {
        // Mock Paystack API response with different balance
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                status: true,
                data: { balance: 600000 }, // Different from escrow total
            }),
        });

        const step = {
            run: async (name: string, fn: Function) => fn(),
        };

        const handler = reconcileEscrow as any;
        const result = await handler({ step });

        expect(result.success).toBe(true);
        expect(result.match).toBe(false);
        expect(result.discrepancy).toBe(-100000); // 500000 - 600000
        expect(result.message).toContain("Mismatch detected");
    });

    it("should handle Paystack API errors gracefully", async () => {
        // Mock Paystack API error
        (global.fetch as any).mockResolvedValue({
            ok: false,
            statusText: "Unauthorized",
            json: async () => ({
                message: "Invalid API key",
            }),
        });

        const step = {
            run: async (name: string, fn: Function) => fn(),
        };

        const handler = reconcileEscrow as any;

        await expect(handler({ step })).rejects.toThrow();
    });

    it("should handle network failures", async () => {
        // Mock network error
        (global.fetch as any).mockRejectedValue(new Error("Network error"));

        const step = {
            run: async (name: string, fn: Function) => fn(),
        };

        const handler = reconcileEscrow as any;

        await expect(handler({ step })).rejects.toThrow("Network error");
    });

    it("should calculate correct discrepancy", async () => {
        // Mock Paystack API response
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                status: true,
                data: { balance: 450000 },
            }),
        });

        const step = {
            run: async (name: string, fn: Function) => fn(),
        };

        const handler = reconcileEscrow as any;
        const result = await handler({ step });

        expect(result.discrepancy).toBe(50000); // 500000 - 450000
        expect(result.match).toBe(false);
    });
});
