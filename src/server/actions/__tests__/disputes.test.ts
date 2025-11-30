import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDispute, resolveDispute, uploadDisputeEvidence } from '../disputes';

// Mock dependencies
vi.mock('@/db', () => ({
    db: {
        query: {
            disputes: {
                findFirst: vi.fn(),
            },
            escrowHolds: {
                findFirst: vi.fn(),
            },
            users: {
                findFirst: vi.fn(),
            },
        },
        transaction: vi.fn((callback) => callback({
            query: {
                disputes: {
                    findFirst: vi.fn(),
                },
                escrowHolds: {
                    findFirst: vi.fn(),
                },
            },
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
        })),
    },
}));

vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(),
}));

vi.mock('@/lib/escrow-state-machine', () => ({
    transitionState: vi.fn(),
}));

vi.mock('@/lib/blob-storage', () => ({
    uploadFile: vi.fn(),
}));

vi.mock('@/lib/fraud-detection', () => ({
    calculateDisputeRate: vi.fn(),
}));

vi.mock('../payments', () => ({
    refundTransaction: vi.fn(),
    releaseFundsToMerchant: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

describe('disputes.ts - Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('createDispute', () => {
        const mockEscrowHold = {
            id: 'hold-123',
            transactionId: 'txn-123',
            state: 'HELD',
            transaction: {
                userId: 'user-123',
            },
        };

        it('should successfully create a dispute', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');
            const { db } = await import('@/db');
            const { transitionState } = await import('@/lib/escrow-state-machine');

            vi.mocked(auth).mockResolvedValue({ userId: 'user-123' });

            // Mock transaction context
            const mockTx = {
                query: {
                    escrowHolds: {
                        findFirst: vi.fn().mockResolvedValue(mockEscrowHold),
                    },
                    disputes: {
                        findFirst: vi.fn().mockResolvedValue(null), // No existing dispute
                    },
                },
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'dispute-123' }]),
                    }),
                }),
            };

            vi.mocked(db.transaction).mockImplementation(async (cb) => cb(mockTx));
            vi.mocked(transitionState).mockResolvedValue({ success: true });

            // Act
            const result = await createDispute({
                escrowHoldId: 'hold-123',
                description: 'Item not received as described',
                evidenceUrls: ['https://example.com/image.jpg'],
            });

            // Assert
            expect(result.success).toBe(true);
            expect(result.disputeId).toBe('dispute-123');
            expect(transitionState).toHaveBeenCalledWith(
                'hold-123',
                'DISPUTED',
                'user-123',
                expect.any(String)
            );
        });

        it('should fail if user does not own transaction', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');
            const { db } = await import('@/db');

            vi.mocked(auth).mockResolvedValue({ userId: 'other-user' });

            const mockTx = {
                query: {
                    escrowHolds: {
                        findFirst: vi.fn().mockResolvedValue(mockEscrowHold),
                    },
                },
            };

            vi.mocked(db.transaction).mockImplementation(async (cb) => cb(mockTx));

            // Act
            const result = await createDispute({
                escrowHoldId: 'hold-123',
                description: 'Test description',
                evidenceUrls: [],
            });

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Unauthorized');
        });

        it('should fail if escrow is not in HELD state', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');
            const { db } = await import('@/db');

            vi.mocked(auth).mockResolvedValue({ userId: 'user-123' });

            const mockTx = {
                query: {
                    escrowHolds: {
                        findFirst: vi.fn().mockResolvedValue({
                            ...mockEscrowHold,
                            state: 'RELEASED',
                        }),
                    },
                },
            };

            vi.mocked(db.transaction).mockImplementation(async (cb) => cb(mockTx));

            // Act
            const result = await createDispute({
                escrowHoldId: 'hold-123',
                description: 'Test description',
                evidenceUrls: [],
            });

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('not in HELD state');
        });

        it('should fail if dispute already exists', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');
            const { db } = await import('@/db');

            vi.mocked(auth).mockResolvedValue({ userId: 'user-123' });

            const mockTx = {
                query: {
                    escrowHolds: {
                        findFirst: vi.fn().mockResolvedValue(mockEscrowHold),
                    },
                    disputes: {
                        findFirst: vi.fn().mockResolvedValue({ id: 'existing-dispute' }),
                    },
                },
            };

            vi.mocked(db.transaction).mockImplementation(async (cb) => cb(mockTx));

            // Act
            const result = await createDispute({
                escrowHoldId: 'hold-123',
                description: 'Test description',
                evidenceUrls: [],
            });

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('already exists');
        });
    });

    describe('resolveDispute', () => {
        const mockDispute = {
            id: 'dispute-123',
            escrowHoldId: 'hold-123',
            status: 'PENDING',
            escrowHold: {
                transactionId: 'txn-123',
            },
        };

        it('should resolve in employee favor (refund)', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');
            const { db } = await import('@/db');
            const { transitionState } = await import('@/lib/escrow-state-machine');
            const { refundTransaction } = await import('../payments');

            vi.mocked(auth).mockResolvedValue({ userId: 'admin-user' });
            vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'admin-user' }); // Mock admin check

            const mockTx = {
                query: {
                    disputes: {
                        findFirst: vi.fn().mockResolvedValue(mockDispute),
                    },
                },
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn(),
                    }),
                }),
            };

            vi.mocked(db.transaction).mockImplementation(async (cb) => cb(mockTx));
            vi.mocked(transitionState).mockResolvedValue({ success: true });
            vi.mocked(refundTransaction).mockResolvedValue({ success: true, data: { refundId: 'ref-123' } });

            // Act
            const result = await resolveDispute({
                disputeId: 'dispute-123',
                resolution: 'RESOLVED_EMPLOYEE_FAVOR',
                notes: 'Valid claim',
            });

            // Assert
            expect(result.success).toBe(true);
            expect(transitionState).toHaveBeenCalledWith('hold-123', 'REFUNDED', 'admin-user', expect.any(String));
            expect(refundTransaction).toHaveBeenCalledWith('txn-123');
        });

        it('should resolve in merchant favor (release)', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');
            const { db } = await import('@/db');
            const { transitionState } = await import('@/lib/escrow-state-machine');
            const { releaseFundsToMerchant } = await import('../payments');

            vi.mocked(auth).mockResolvedValue({ userId: 'admin-user' });
            vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'admin-user' });

            const mockTx = {
                query: {
                    disputes: {
                        findFirst: vi.fn().mockResolvedValue(mockDispute),
                    },
                },
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn(),
                    }),
                }),
            };

            vi.mocked(db.transaction).mockImplementation(async (cb) => cb(mockTx));
            vi.mocked(transitionState).mockResolvedValue({ success: true });
            vi.mocked(releaseFundsToMerchant).mockResolvedValue({ success: true, data: { transferCode: 'trf-123' } });

            // Act
            const result = await resolveDispute({
                disputeId: 'dispute-123',
                resolution: 'RESOLVED_MERCHANT_FAVOR',
                notes: 'Invalid claim',
            });

            // Assert
            expect(result.success).toBe(true);
            expect(transitionState).toHaveBeenCalledWith('hold-123', 'RELEASED', 'admin-user', expect.any(String));
            expect(releaseFundsToMerchant).toHaveBeenCalledWith('txn-123');
        });
    });

    describe('uploadDisputeEvidence', () => {
        it('should upload valid file', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');
            const { uploadFile } = await import('@/lib/blob-storage');

            vi.mocked(auth).mockResolvedValue({ userId: 'user-123' });
            vi.mocked(uploadFile).mockResolvedValue('https://blob.vercel-storage.com/test.jpg');

            const formData = new FormData();
            formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }));

            // Act
            const result = await uploadDisputeEvidence(formData);

            // Assert
            expect(result.success).toBe(true);
            expect(result.url).toBe('https://blob.vercel-storage.com/test.jpg');
        });

        it('should reject invalid file type', async () => {
            // Arrange
            const { auth } = await import('@clerk/nextjs/server');
            vi.mocked(auth).mockResolvedValue({ userId: 'user-123' });

            const formData = new FormData();
            formData.append('file', new File(['test'], 'test.exe', { type: 'application/x-msdownload' }));

            // Act
            const result = await uploadDisputeEvidence(formData);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid file type');
        });
    });
});
