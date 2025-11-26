import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEscrowHold } from '../escrow';

// Mock dependencies
vi.mock('@/db', () => ({
    db: {
        query: {
            transactions: {
                findFirst: vi.fn(),
            },
            escrowHolds: {
                findFirst: vi.fn(),
            },
        },
        transaction: vi.fn(),
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(),
            })),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(),
            })),
        })),
    },
}));

describe('escrow.ts - Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('createEscrowHold', () => {
        const mockTransaction = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            userId: 'user-123',
            dealId: 'deal-123',
            merchantId: '123e4567-e89b-12d3-a456-426614174001',
            amount: 50000,
            status: 'completed',
            paystackReference: 'txn_test_123',
            escrowHoldId: null,
        };

        const mockEscrowHold = {
            id: 'escrow-123',
            transactionId: '123e4567-e89b-12d3-a456-426614174000',
            merchantId: '123e4567-e89b-12d3-a456-426614174001',
            amount: 50000,
            state: 'HELD',
            heldAt: new Date(),
        };

        it('should successfully create escrow hold for completed transaction', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.transactions.findFirst).mockResolvedValue(mockTransaction);

            // Mock atomic transaction
            vi.mocked(db.transaction).mockImplementation(async (callback: any) => {
                const mockTx = {
                    insert: vi.fn(() => ({
                        values: vi.fn(() => ({
                            returning: vi.fn().mockResolvedValue([mockEscrowHold]),
                        })),
                    })),
                    update: vi.fn(() => ({
                        set: vi.fn(() => ({
                            where: vi.fn(),
                        })),
                    })),
                };
                return callback(mockTx);
            });

            // Act
            const result = await createEscrowHold('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001', 50000);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data?.escrowHoldId).toBe('escrow-123');
            expect(db.transaction).toHaveBeenCalled(); // Verify atomic transaction used
        });

        it('should return existing escrow hold if already created', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
                ...mockTransaction,
                escrowHoldId: 'escrow-existing',
            });

            vi.mocked(db.query.escrowHolds.findFirst).mockResolvedValue({
                ...mockEscrowHold,
                id: 'escrow-existing',
            });

            // Act
            const result = await createEscrowHold('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001', 50000);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data?.escrowHoldId).toBe('escrow-existing');
            expect(db.transaction).not.toHaveBeenCalled(); // Should not create new hold
        });

        it('should fail with invalid transaction ID', async () => {
            // Act
            const result = await createEscrowHold('invalid-id', '123e4567-e89b-12d3-a456-426614174001', 50000);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid transaction ID');
        });

        it('should fail with invalid merchant ID', async () => {
            // Act
            const result = await createEscrowHold('123e4567-e89b-12d3-a456-426614174000', 'invalid-id', 50000);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid merchant ID');
        });

        it('should fail with negative amount', async () => {
            // Act
            const result = await createEscrowHold('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001', -1000);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Amount must be positive');
        });

        it('should fail when transaction does not exist', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.transactions.findFirst).mockResolvedValue(null);

            // Act
            const result = await createEscrowHold('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001', 50000);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Transaction not found');
        });

        it('should fail when transaction is not completed', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
                ...mockTransaction,
                status: 'pending',
            });

            // Act
            const result = await createEscrowHold('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001', 50000);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Cannot create escrow hold for non-completed transaction');
        });

        it('should handle database transaction errors gracefully', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.transactions.findFirst).mockResolvedValue(mockTransaction);
            vi.mocked(db.transaction).mockRejectedValue(new Error('Database error'));

            // Act
            const result = await createEscrowHold('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001', 50000);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('An unexpected error occurred');
        });

        it('should create escrow hold with HELD state', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.transactions.findFirst).mockResolvedValue(mockTransaction);

            let insertedValues: any;
            vi.mocked(db.transaction).mockImplementation(async (callback: any) => {
                const mockTx = {
                    insert: vi.fn(() => ({
                        values: vi.fn((values: any) => {
                            insertedValues = values;
                            return {
                                returning: vi.fn().mockResolvedValue([mockEscrowHold]),
                            };
                        }),
                    })),
                    update: vi.fn(() => ({
                        set: vi.fn(() => ({
                            where: vi.fn(),
                        })),
                    })),
                };
                return callback(mockTx);
            });

            // Act
            await createEscrowHold('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001', 50000);

            // Assert
            expect(insertedValues.state).toBe('HELD');
            expect(insertedValues.transactionId).toBe('123e4567-e89b-12d3-a456-426614174000');
            expect(insertedValues.merchantId).toBe('123e4567-e89b-12d3-a456-426614174001');
            expect(insertedValues.amount).toBe(50000);
        });

        it('should link escrow hold to transaction atomically', async () => {
            // Arrange
            const { db } = await import('@/db');

            vi.mocked(db.query.transactions.findFirst).mockResolvedValue(mockTransaction);

            let updateCalled = false;
            vi.mocked(db.transaction).mockImplementation(async (callback: any) => {
                const mockTx = {
                    insert: vi.fn(() => ({
                        values: vi.fn(() => ({
                            returning: vi.fn().mockResolvedValue([mockEscrowHold]),
                        })),
                    })),
                    update: vi.fn(() => ({
                        set: vi.fn(() => ({
                            where: vi.fn(() => {
                                updateCalled = true;
                            }),
                        })),
                    })),
                };
                return callback(mockTx);
            });

            // Act
            await createEscrowHold('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001', 50000);

            // Assert
            expect(updateCalled).toBe(true); // Verify transaction was updated
        });
    });
});
