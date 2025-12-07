import { POST } from '../route';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Mock dependencies
vi.mock('@/db', () => ({
    db: {
        query: {
            transactions: {
                findFirst: vi.fn(),
            },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(),
            })),
        })),
    },
}));

vi.mock('@/server/actions/escrow', () => ({
    createEscrowHold: vi.fn(),
}));

vi.mock('@/server/actions/notifications', () => ({
    sendMerchantEscrowNotification: vi.fn(),
}));

describe('Paystack Webhook Handler', () => {
    const MOCK_SECRET = 'test_secret_key';

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.PAYSTACK_SECRET_KEY = MOCK_SECRET;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function createSignedRequest(payload: any): NextRequest {
        const body = JSON.stringify(payload);
        const hash = crypto
            .createHmac('sha512', MOCK_SECRET)
            .update(body)
            .digest('hex');

        return {
            text: async () => body,
            headers: {
                get: (name: string) => {
                    if (name === 'x-paystack-signature') return hash;
                    return null;
                },
            },
        } as unknown as NextRequest;
    }

    describe('Signature Verification', () => {
        it('should reject webhook with missing signature', async () => {
            // Arrange
            const request = {
                text: async () => JSON.stringify({ event: 'charge.success' }),
                headers: {
                    get: () => null,
                },
            } as unknown as NextRequest;

            // Act
            const response = await POST(request);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(400);
            expect(data.error).toContain('Signature missing');
        });

        it('should reject webhook with invalid signature', async () => {
            // Arrange
            const request = {
                text: async () => JSON.stringify({ event: 'charge.success' }),
                headers: {
                    get: () => 'invalid_signature',
                },
            } as unknown as NextRequest;

            // Act
            const response = await POST(request);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(400);
            expect(data.error).toContain('Invalid signature');
        });

        it('should accept webhook with valid signature', async () => {
            // Arrange
            const payload = {
                event: 'charge.success',
                data: {
                    reference: 'test_ref_123',
                    amount: 50000,
                    status: 'success',
                },
            };
            const request = createSignedRequest(payload);

            const { db } = await import('@/db');
            vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
                id: 'txn-123',
                status: 'pending',
                merchantId: 'merchant-123',
                amount: 50000,
                paystackReference: 'test_ref_123',
            } as any);

            const { createEscrowHold } = await import('@/server/actions/escrow');
            vi.mocked(createEscrowHold).mockResolvedValue({
                success: true,
                data: { escrowHoldId: 'escrow-123' },
            });

            const { sendMerchantEscrowNotification } = await import('@/server/actions/notifications');
            vi.mocked(sendMerchantEscrowNotification).mockResolvedValue({
                success: true,
                data: { emailId: 'email-123' },
            });

            // Act
            const response = await POST(request);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(200);
            expect(data.status).toBe('success');
        });
    });

    describe('charge.success Event', () => {
        it('should update transaction status to completed', async () => {
            // Arrange
            const payload = {
                event: 'charge.success',
                data: {
                    reference: 'test_ref_123',
                    amount: 50000,
                    status: 'success',
                },
            };
            const request = createSignedRequest(payload);

            const { db } = await import('@/db');
            vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
                id: 'txn-123',
                status: 'pending',
                merchantId: 'merchant-123',
                amount: 50000,
                paystackReference: 'test_ref_123',
            } as any);

            const mockUpdate = vi.fn();
            vi.mocked(db.update).mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: mockUpdate,
                }),
            } as any);

            const { createEscrowHold } = await import('@/server/actions/escrow');
            vi.mocked(createEscrowHold).mockResolvedValue({
                success: true,
                data: { escrowHoldId: 'escrow-123' },
            });

            const { sendMerchantEscrowNotification } = await import('@/server/actions/notifications');
            vi.mocked(sendMerchantEscrowNotification).mockResolvedValue({
                success: true,
                data: { emailId: 'email-123' },
            });

            // Act
            await POST(request);

            // Assert
            expect(mockUpdate).toHaveBeenCalled();
        });

        it('should create escrow hold after successful charge', async () => {
            // Arrange
            const payload = {
                event: 'charge.success',
                data: {
                    reference: 'test_ref_123',
                    amount: 50000,
                    status: 'success',
                },
            };
            const request = createSignedRequest(payload);

            const { db } = await import('@/db');
            vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
                id: 'txn-123',
                status: 'pending',
                merchantId: 'merchant-123',
                amount: 50000,
                paystackReference: 'test_ref_123',
            } as any);

            const { createEscrowHold } = await import('@/server/actions/escrow');
            vi.mocked(createEscrowHold).mockResolvedValue({
                success: true,
                data: { escrowHoldId: 'escrow-123' },
            });

            const { sendMerchantEscrowNotification } = await import('@/server/actions/notifications');
            vi.mocked(sendMerchantEscrowNotification).mockResolvedValue({
                success: true,
                data: { emailId: 'email-123' },
            });

            // Act
            await POST(request);

            // Assert
            expect(createEscrowHold).toHaveBeenCalledWith('txn-123', 'merchant-123', 50000);
        });

        it('should send merchant notification after escrow creation', async () => {
            // Arrange
            const payload = {
                event: 'charge.success',
                data: {
                    reference: 'test_ref_123',
                    amount: 50000,
                    status: 'success',
                },
            };
            const request = createSignedRequest(payload);

            const { db } = await import('@/db');
            vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
                id: 'txn-123',
                status: 'pending',
                merchantId: 'merchant-123',
                amount: 50000,
                paystackReference: 'test_ref_123',
            } as any);

            const { createEscrowHold } = await import('@/server/actions/escrow');
            vi.mocked(createEscrowHold).mockResolvedValue({
                success: true,
                data: { escrowHoldId: 'escrow-123' },
            });

            const { sendMerchantEscrowNotification } = await import('@/server/actions/notifications');
            vi.mocked(sendMerchantEscrowNotification).mockResolvedValue({
                success: true,
                data: { emailId: 'email-123' },
            });

            // Act
            await POST(request);

            // Assert
            expect(sendMerchantEscrowNotification).toHaveBeenCalledWith('merchant-123', 'txn-123');
        });

        it('should handle idempotency - skip if already processed', async () => {
            // Arrange
            const payload = {
                event: 'charge.success',
                data: {
                    reference: 'test_ref_123',
                    amount: 50000,
                    status: 'success',
                },
            };
            const request = createSignedRequest(payload);

            const { db } = await import('@/db');
            vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
                id: 'txn-123',
                status: 'completed', // Already processed
                merchantId: 'merchant-123',
                amount: 50000,
                paystackReference: 'test_ref_123',
                escrowHoldId: 'escrow-existing',
            } as any);

            const { createEscrowHold } = await import('@/server/actions/escrow');
            const { sendMerchantEscrowNotification } = await import('@/server/actions/notifications');

            // Act
            await POST(request);

            // Assert
            expect(createEscrowHold).not.toHaveBeenCalled();
            expect(sendMerchantEscrowNotification).not.toHaveBeenCalled();
        });

        it('should handle missing transaction gracefully', async () => {
            // Arrange
            const payload = {
                event: 'charge.success',
                data: {
                    reference: 'nonexistent_ref',
                    amount: 50000,
                    status: 'success',
                },
            };
            const request = createSignedRequest(payload);

            const { db } = await import('@/db');
            vi.mocked(db.query.transactions.findFirst).mockResolvedValue(null);

            // Act
            const response = await POST(request);

            // Assert
            expect(response.status).toBe(200); // Should still return 200 to acknowledge
        });
    });

    describe('charge.failed Event', () => {
        it('should update transaction status to failed', async () => {
            // Arrange
            const payload = {
                event: 'charge.failed',
                data: {
                    reference: 'test_ref_123',
                    amount: 50000,
                    status: 'failed',
                },
            };
            const request = createSignedRequest(payload);

            const { db } = await import('@/db');
            vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
                id: 'txn-123',
                status: 'pending',
                paystackReference: 'test_ref_123',
            } as any);

            const mockUpdate = vi.fn();
            vi.mocked(db.update).mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: mockUpdate,
                }),
            } as any);

            // Act
            await POST(request);

            // Assert
            expect(mockUpdate).toHaveBeenCalled();
        });

        it('should NOT create escrow hold for failed charge', async () => {
            // Arrange
            const payload = {
                event: 'charge.failed',
                data: {
                    reference: 'test_ref_123',
                    amount: 50000,
                    status: 'failed',
                },
            };
            const request = createSignedRequest(payload);

            const { db } = await import('@/db');
            vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
                id: 'txn-123',
                status: 'pending',
                paystackReference: 'test_ref_123',
            } as any);

            const { createEscrowHold } = await import('@/server/actions/escrow');

            // Act
            await POST(request);

            // Assert
            expect(createEscrowHold).not.toHaveBeenCalled();
        });

        it('should handle idempotency for failed charges', async () => {
            // Arrange
            const payload = {
                event: 'charge.failed',
                data: {
                    reference: 'test_ref_123',
                    amount: 50000,
                    status: 'failed',
                },
            };
            const request = createSignedRequest(payload);

            const { db } = await import('@/db');
            vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
                id: 'txn-123',
                status: 'failed', // Already marked as failed
                paystackReference: 'test_ref_123',
            } as any);

            const mockUpdate = vi.fn();
            vi.mocked(db.update).mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: mockUpdate,
                }),
            } as any);

            // Act
            await POST(request);

            // Assert
            expect(mockUpdate).not.toHaveBeenCalled(); // Should skip update
        });
    });

    describe('Unknown Events', () => {
        it('should handle unknown event types gracefully', async () => {
            // Arrange
            const payload = {
                event: 'unknown.event',
                data: {},
            };
            const request = createSignedRequest(payload);

            // Act
            const response = await POST(request);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(200);
            expect(data.status).toBe('success');
        });
    });
});
