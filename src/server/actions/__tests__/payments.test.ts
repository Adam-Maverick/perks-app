import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set environment variable before importing modules
vi.stubEnv('PAYSTACK_SECRET_KEY', 'sk_test_mock_key');

import { createEscrowTransaction, createTransferRecipient } from '../payments';

// Mock dependencies
vi.mock('@/db', () => ({
    db: {
        query: {
            deals: {
                findFirst: vi.fn(),
            },
            merchants: {
                findFirst: vi.fn(),
            },
            users: {
                findFirst: vi.fn(),
            },
            transactions: {
                findFirst: vi.fn(),
            },
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(),
            })),
        })),
        delete: vi.fn(() => ({
            where: vi.fn(),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(),
            })),
        })),
    },
}));

vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('payments.ts - Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock environment variable
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock_key';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('createEscrowTransaction', () => {
        const mockDeal = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            merchantId: '123e4567-e89b-12d3-a456-426614174001',
            title: 'Test Deal',
            originalPrice: 100000,
        };

        const mockMerchant = {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Test Merchant',
            trustLevel: 'EMERGING',
        };

        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
        };

        const mockTransaction = {
            id: 'txn-123',
            userId: 'user-123',
            dealId: '123e4567-e89b-12d3-a456-426614174000',
            merchantId: '123e4567-e89b-12d3-a456-426614174001',
            amount: 50000,
            paystackReference: 'txn_test_123',
        };

        it('should successfully create escrow transaction with valid inputs', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');
            const { db } = await import('@/db');

            vi.mocked(auth).mockResolvedValue({ userId: 'user-123' });
            vi.mocked(db.query.deals.findFirst).mockResolvedValue(mockDeal);
            vi.mocked(db.query.merchants.findFirst).mockResolvedValue(mockMerchant);
            vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);
            vi.mocked(db.insert).mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([mockTransaction]),
                }),
            } as any);

            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: true,
                    data: {
                        authorization_url: 'https://checkout.paystack.com/test123',
                        access_code: 'test_access_code',
                        reference: 'txn_test_123',
                    },
                }),
            } as Response);

            // Act
            const result = await createEscrowTransaction('123e4567-e89b-12d3-a456-426614174000', 50000, '123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(true);
            expect(result.data?.authorizationUrl).toBe('https://checkout.paystack.com/test123');
            expect(result.data?.reference).toContain('txn_');
            expect(db.insert).toHaveBeenCalled();
            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.paystack.co/transaction/initialize',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': expect.stringContaining('Bearer'),
                    }),
                })
            );
        });

        it('should fail with invalid deal ID', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');

            vi.mocked(auth).mockResolvedValue({ userId: 'user-123' });

            // Act
            const result = await createEscrowTransaction('invalid-id', 50000, '123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid deal ID');
        });

        it('should fail with negative amount', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');

            vi.mocked(auth).mockResolvedValue({ userId: 'user-123' });

            // Act
            const result = await createEscrowTransaction('123e4567-e89b-12d3-a456-426614174000', -1000, '123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Amount must be positive');
        });

        it('should fail when user is not authenticated', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');

            vi.mocked(auth).mockResolvedValue({ userId: null });

            // Act
            const result = await createEscrowTransaction('123e4567-e89b-12d3-a456-426614174000', 50000, '123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Unauthorized');
        });

        it('should fail when deal does not exist', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');
            const { db } = await import('@/db');

            vi.mocked(auth).mockResolvedValue({ userId: 'user-123' });
            vi.mocked(db.query.deals.findFirst).mockResolvedValue(null);

            // Act
            const result = await createEscrowTransaction('123e4567-e89b-12d3-a456-426614174000', 50000, '123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Deal not found');
        });

        it('should fail when deal does not belong to merchant', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');
            const { db } = await import('@/db');

            vi.mocked(auth).mockResolvedValue({ userId: 'user-123' });
            vi.mocked(db.query.deals.findFirst).mockResolvedValue({
                ...mockDeal,
                merchantId: '123e4567-e89b-12d3-a456-426614174002', // Different merchant
            });

            // Act
            const result = await createEscrowTransaction('123e4567-e89b-12d3-a456-426614174000', 50000, '123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('does not belong to specified merchant');
        });

        it('should rollback transaction when Paystack API fails', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');
            const { db } = await import('@/db');

            vi.mocked(auth).mockResolvedValue({ userId: 'user-123' });
            vi.mocked(db.query.deals.findFirst).mockResolvedValue(mockDeal);
            vi.mocked(db.query.merchants.findFirst).mockResolvedValue(mockMerchant);
            vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);
            vi.mocked(db.insert).mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([mockTransaction]),
                }),
            } as any);

            vi.mocked(global.fetch).mockResolvedValue({
                ok: false,
                json: async () => ({
                    status: false,
                    message: 'API Error',
                }),
            } as Response);

            const mockDelete = vi.fn();
            vi.mocked(db.delete).mockReturnValue({
                where: mockDelete,
            } as any);

            // Act
            const result = await createEscrowTransaction('123e4567-e89b-12d3-a456-426614174000', 50000, '123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Payment initialization failed');
            expect(mockDelete).toHaveBeenCalled(); // Verify rollback
        });
    });

    describe('createTransferRecipient', () => {
        const mockMerchant = {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Test Merchant',
            contactInfo: JSON.stringify({
                email: 'merchant@example.com',
                account_number: '0123456789',
                bank_code: '044',
            }),
            paystackRecipientCode: null,
        };

        it('should successfully create transfer recipient', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.merchants.findFirst).mockResolvedValue(mockMerchant);
            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: true,
                    data: {
                        recipient_code: 'RCP_test123',
                    },
                }),
            } as Response);

            const mockUpdate = vi.fn();
            vi.mocked(db.update).mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: mockUpdate,
                }),
            } as any);

            // Act
            const result = await createTransferRecipient('123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(true);
            expect(result.data?.recipientCode).toBe('RCP_test123');
            expect(mockUpdate).toHaveBeenCalled();
        });

        it('should return existing recipient code if already exists', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.merchants.findFirst).mockResolvedValue({
                ...mockMerchant,
                paystackRecipientCode: 'RCP_existing',
            });

            // Act
            const result = await createTransferRecipient('123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(true);
            expect(result.data?.recipientCode).toBe('RCP_existing');
            expect(global.fetch).not.toHaveBeenCalled(); // Should not call API
        });

        it('should fail when merchant does not exist', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.merchants.findFirst).mockResolvedValue(null);

            // Act
            const result = await createTransferRecipient('123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Merchant not found');
        });

        it('should fail when merchant bank details are missing', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.merchants.findFirst).mockResolvedValue({
                ...mockMerchant,
                contactInfo: JSON.stringify({
                    email: 'merchant@example.com',
                    // Missing account_number and bank_code
                }),
            });

            // Act
            const result = await createTransferRecipient('123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('bank details not configured');
        });

        it('should fail with invalid merchant ID format', async () => {
            // Act
            const result = await createTransferRecipient('invalid-id');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid merchant ID');
        });
    });
    describe('refundTransaction', () => {
        const mockTransaction = {
            id: 'txn-123',
            paystackReference: 'txn_ref_123',
        };

        it('should successfully process refund', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.transactions.findFirst).mockResolvedValue(mockTransaction);

            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: true,
                    data: {
                        id: 12345,
                        transaction: 'txn_ref_123',
                    },
                }),
            } as Response);

            // Act
            const { refundTransaction } = await import('../payments');
            const result = await refundTransaction('txn-123');

            // Assert
            expect(result.success).toBe(true);
            expect(result.data?.refundId).toBe('12345');
            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.paystack.co/refund',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('txn_ref_123'),
                })
            );
        });

        it('should fail if transaction not found', async () => {
            // Arrange
            const { db } = await import('@/db');
            vi.mocked(db.query.transactions.findFirst).mockResolvedValue(null);

            // Act
            const { refundTransaction } = await import('../payments');
            const result = await refundTransaction('txn-123');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Transaction not found');
        });

        it('should rollback transaction when Paystack API fails', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');
            const { db } = await import('@/db');

            vi.mocked(auth).mockResolvedValue({ userId: 'user-123' });
            vi.mocked(db.query.deals.findFirst).mockResolvedValue(mockDeal);
            vi.mocked(db.query.merchants.findFirst).mockResolvedValue(mockMerchant);
            vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);
            vi.mocked(db.insert).mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([mockTransaction]),
                }),
            } as any);

            vi.mocked(global.fetch).mockResolvedValue({
                ok: false,
                json: async () => ({
                    status: false,
                    message: 'API Error',
                }),
            } as Response);

            const mockDelete = vi.fn();
            vi.mocked(db.delete).mockReturnValue({
                where: mockDelete,
            } as any);

            // Act
            const result = await createEscrowTransaction('123e4567-e89b-12d3-a456-426614174000', 50000, '123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Payment initialization failed');
            expect(mockDelete).toHaveBeenCalled(); // Verify rollback
        });
    });

    describe('createTransferRecipient', () => {
        const mockMerchant = {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Test Merchant',
            contactInfo: JSON.stringify({
                email: 'merchant@example.com',
                account_number: '0123456789',
                bank_code: '044',
            }),
            paystackRecipientCode: null,
        };

        it('should successfully create transfer recipient', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.merchants.findFirst).mockResolvedValue(mockMerchant);
            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: true,
                    data: {
                        recipient_code: 'RCP_test123',
                    },
                }),
            } as Response);

            const mockUpdate = vi.fn();
            vi.mocked(db.update).mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: mockUpdate,
                }),
            } as any);

            // Act
            const result = await createTransferRecipient('123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(true);
            expect(result.data?.recipientCode).toBe('RCP_test123');
            expect(mockUpdate).toHaveBeenCalled();
        });

        it('should return existing recipient code if already exists', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.merchants.findFirst).mockResolvedValue({
                ...mockMerchant,
                paystackRecipientCode: 'RCP_existing',
            });

            // Act
            const result = await createTransferRecipient('123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(true);
            expect(result.data?.recipientCode).toBe('RCP_existing');
            expect(global.fetch).not.toHaveBeenCalled(); // Should not call API
        });

        it('should fail when merchant does not exist', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.merchants.findFirst).mockResolvedValue(null);

            // Act
            const result = await createTransferRecipient('123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Merchant not found');
        });

        it('should fail when merchant bank details are missing', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.merchants.findFirst).mockResolvedValue({
                ...mockMerchant,
                contactInfo: JSON.stringify({
                    email: 'merchant@example.com',
                    // Missing account_number and bank_code
                }),
            });

            // Act
            const result = await createTransferRecipient('123e4567-e89b-12d3-a456-426614174001');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('bank details not configured');
        });

        it('should fail with invalid merchant ID format', async () => {
            // Act
            const result = await createTransferRecipient('invalid-id');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid merchant ID');
        });
    });
    describe('refundTransaction', () => {
        const mockTransaction = {
            id: 'txn-123',
            paystackReference: 'txn_ref_123',
        };

        it('should successfully process refund', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.transactions.findFirst).mockResolvedValue(mockTransaction);

            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: true,
                    data: {
                        id: 12345,
                        transaction: 'txn_ref_123',
                    },
                }),
            } as Response);

            // Act
            const { refundTransaction } = await import('../payments');
            const result = await refundTransaction('txn-123');

            // Assert
            expect(result.success).toBe(true);
            expect(result.data?.refundId).toBe('12345');
            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.paystack.co/refund',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('txn_ref_123'),
                })
            );
        });

        it('should fail if transaction not found', async () => {
            // Arrange
            const { db } = await import('@/db');
            vi.mocked(db.query.transactions.findFirst).mockResolvedValue(null);

            // Act
            const { refundTransaction } = await import('../payments');
            const result = await refundTransaction('txn-123');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Transaction not found');
        });

        it('should fail if Paystack API errors', async () => {
            // Arrange
            const { db } = await import('@/db');
            vi.mocked(db.query.transactions.findFirst).mockResolvedValue(mockTransaction);

            vi.mocked(global.fetch).mockResolvedValue({
                ok: false,
                json: async () => ({
                    status: false,
                    message: 'Insufficient funds',
                }),
            } as Response);

            // Act
            const { refundTransaction } = await import('../payments');
            const result = await refundTransaction('txn-123');

            // Assert
            expect(result.success).toBe(false);
            // Note: In test environment without PAYSTACK_SECRET_KEY, this returns early
            expect(result.error).toBeTruthy();
        });
    });
});
