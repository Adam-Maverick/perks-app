import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendMerchantEscrowNotification } from '../notifications';

// Mock dependencies
vi.mock('@/db', () => ({
    db: {
        query: {
            transactions: {
                findFirst: vi.fn(),
            },
        },
    },
}));

vi.mock('resend', () => ({
    Resend: vi.fn(() => ({
        emails: {
            send: vi.fn(),
        },
    })),
}));

vi.mock('@/components/emails/merchant-escrow-notification', () => ({
    default: vi.fn(() => '<div>Email Content</div>'),
}));

describe('notifications.ts - Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('sendMerchantEscrowNotification', () => {
        const mockTransaction = {
            id: 'txn-123',
            amount: 50000,
            paystackReference: 'txn_test_123',
            merchant: {
                id: 'merchant-123',
                name: 'Test Merchant',
                contactInfo: JSON.stringify({
                    email: 'merchant@example.com',
                }),
            },
            escrowHold: {
                id: 'escrow-123',
            },
        };

        it('should successfully send email notification', async () => {
            // Arrange
            const { db } = await import('@/db');
            const { Resend } = await import('resend');

            vi.mocked(db.query.transactions.findFirst).mockResolvedValue(mockTransaction);

            const mockSend = vi.fn().mockResolvedValue({ data: { id: 'email-123' }, error: null });
            vi.mocked(Resend).mockImplementation(() => ({
                emails: {
                    send: mockSend,
                },
            } as any));

            // Act
            const result = await sendMerchantEscrowNotification('merchant-123', 'txn-123');

            // Assert
            expect(result.success).toBe(true);
            expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
                to: ['merchant@example.com'],
                subject: 'Payment Received - Funds in Escrow',
            }));
        });

        it('should fail when transaction does not exist', async () => {
            // Arrange
            const { db } = await import('@/db');
            vi.mocked(db.query.transactions.findFirst).mockResolvedValue(null);

            // Act
            const result = await sendMerchantEscrowNotification('merchant-123', 'txn-123');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Transaction not found');
        });

        it('should fail when merchant email is missing', async () => {
            // Arrange
            const { db } = await import('@/db');
            vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
                ...mockTransaction,
                merchant: {
                    ...mockTransaction.merchant,
                    contactInfo: JSON.stringify({}), // No email
                },
            });

            // Act
            const result = await sendMerchantEscrowNotification('merchant-123', 'txn-123');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Merchant email not found');
        });

        it('should handle Resend API errors', async () => {
            // Arrange
            const { db } = await import('@/db');
            const { Resend } = await import('resend');

            vi.mocked(db.query.transactions.findFirst).mockResolvedValue(mockTransaction);

            const mockSend = vi.fn().mockResolvedValue({ data: null, error: { message: 'API Error' } });
            vi.mocked(Resend).mockImplementation(() => ({
                emails: {
                    send: mockSend,
                },
            } as any));

            // Act
            const result = await sendMerchantEscrowNotification('merchant-123', 'txn-123');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to send email');
        });
    });
});
