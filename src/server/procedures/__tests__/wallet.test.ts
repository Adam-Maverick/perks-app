/**
 * Wallet Procedures Tests (Story 5.1)
 *
 * Tests for wallet creation, balance tracking, and transaction logic.
 */

// Mock data
const mockUser = { id: 'user_123', email: 'test@example.com' };
const mockWallet = {
    id: 'wallet_abc',
    userId: 'user_123',
    balance: 0,
    currency: 'NGN',
    createdAt: new Date(),
    updatedAt: new Date(),
};

// Mock the database module
vi.mock('@/db', () => ({
    db: {
        query: {
            users: {
                findFirst: vi.fn(),
            },
            wallets: {
                findFirst: vi.fn(),
            },
        },
        insert: vi.fn(),
        update: vi.fn(),
        select: vi.fn(),
    },
}));

import { db } from '@/db';
import {
    createWallet,
    getWalletByUserId,
    getWalletBalance,
    calculateBalanceFromTransactions,
    getOrCreateWallet,
    updateWalletBalance,
} from '../wallet';

describe('Wallet Procedures', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createWallet', () => {
        it('should create a wallet for a valid user', async () => {
            const mockUser = { id: 'user_123', email: 'test@example.com' };
            const mockWallet = {
                id: 'wallet_abc',
                userId: 'user_123',
                balance: 0,
                currency: 'NGN',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // Mock user exists
            vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);
            // Mock no existing wallet
            vi.mocked(db.query.wallets.findFirst).mockResolvedValue(undefined);
            // Mock insert
            vi.mocked(db.insert).mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([mockWallet]),
                }),
            } as unknown as ReturnType<typeof db.insert>);

            const result = await createWallet('user_123');

            expect(result).toEqual(mockWallet);
            expect(db.query.users.findFirst).toHaveBeenCalled();
            expect(db.insert).toHaveBeenCalled();
        });

        it('should throw if user does not exist', async () => {
            // Mock user not found
            vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

            await expect(createWallet('nonexistent_user')).rejects.toThrow(
                'User not found: nonexistent_user'
            );
        });

        it('should throw if wallet already exists (AC: 2 - 1:1 relationship)', async () => {
            const mockUser = { id: 'user_123', email: 'test@example.com' };
            const existingWallet = {
                id: 'wallet_existing',
                userId: 'user_123',
                balance: 1000,
                currency: 'NGN',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // Mock user exists
            vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);
            // Mock wallet already exists
            vi.mocked(db.query.wallets.findFirst).mockResolvedValue(existingWallet);

            await expect(createWallet('user_123')).rejects.toThrow(
                'Wallet already exists for user: user_123'
            );
        });
    });

    describe('getWalletByUserId', () => {
        it('should return wallet if exists', async () => {
            const mockWallet = {
                id: 'wallet_abc',
                userId: 'user_123',
                balance: 5000,
                currency: 'NGN',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(db.query.wallets.findFirst).mockResolvedValue(mockWallet);

            const result = await getWalletByUserId('user_123');

            expect(result).toEqual(mockWallet);
        });

        it('should return null if wallet does not exist', async () => {
            vi.mocked(db.query.wallets.findFirst).mockResolvedValue(undefined);

            const result = await getWalletByUserId('user_no_wallet');

            expect(result).toBeNull();
        });
    });

    describe('getWalletBalance', () => {
        it('should return balance from wallet', async () => {
            const mockWallet = {
                id: 'wallet_abc',
                userId: 'user_123',
                balance: 15000, // 150 NGN in kobo
                currency: 'NGN',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(db.query.wallets.findFirst).mockResolvedValue(mockWallet);

            const result = await getWalletBalance('user_123');

            expect(result).toBe(15000);
        });

        it('should return 0 if no wallet exists', async () => {
            vi.mocked(db.query.wallets.findFirst).mockResolvedValue(undefined);

            const result = await getWalletBalance('user_no_wallet');

            expect(result).toBe(0);
        });
    });

    describe('getOrCreateWallet', () => {
        it('should return existing wallet if exists', async () => {
            const mockWallet = {
                id: 'wallet_abc',
                userId: 'user_123',
                balance: 5000,
                currency: 'NGN',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(db.query.wallets.findFirst).mockResolvedValue(mockWallet);

            const result = await getOrCreateWallet('user_123');

            expect(result).toEqual(mockWallet);
            expect(db.insert).not.toHaveBeenCalled();
        });

        it('should create wallet if not exists', async () => {
            const mockUser = { id: 'user_123', email: 'test@example.com' };
            const mockNewWallet = {
                id: 'wallet_new',
                userId: 'user_123',
                balance: 0,
                currency: 'NGN',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // First call (getWalletByUserId) - no wallet
            // Second call (createWallet check) - still no wallet
            vi.mocked(db.query.wallets.findFirst)
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined);
            vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);
            vi.mocked(db.insert).mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([mockNewWallet]),
                }),
            } as unknown as ReturnType<typeof db.insert>);

            const result = await getOrCreateWallet('user_123');

            expect(result).toEqual(mockNewWallet);
        });
    });

    describe('updateWalletBalance', () => {
        it('should atomically update balance with positive delta', async () => {
            const mockUpdatedWallet = {
                id: 'wallet_abc',
                userId: 'user_123',
                balance: 10000, // After adding 5000
                currency: 'NGN',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(db.update).mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([mockUpdatedWallet]),
                    }),
                }),
            } as unknown as ReturnType<typeof db.update>);

            const result = await updateWalletBalance('wallet_abc', 5000);

            expect(result.balance).toBe(10000);
        });

        it('should throw if wallet not found', async () => {
            vi.mocked(db.update).mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([]),
                    }),
                }),
            } as unknown as ReturnType<typeof db.update>);

            await expect(updateWalletBalance('nonexistent', 1000)).rejects.toThrow(
                'Wallet not found: nonexistent'
            );
        });

        it('should throw if balance would go negative (AC: 6)', async () => {
            const mockUpdatedWallet = {
                id: 'wallet_abc',
                userId: 'user_123',
                balance: -1000, // Simulating a negative result
                currency: 'NGN',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(db.update).mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([mockUpdatedWallet]),
                    }),
                }),
            } as unknown as ReturnType<typeof db.update>);

            await expect(updateWalletBalance('wallet_abc', -5000)).rejects.toThrow(
                'Insufficient wallet balance'
            );
        });
    });

    describe('calculateBalanceFromTransactions (AC: 7)', () => {
        it('should calculate balance from completed transactions', async () => {
            // Mock credits query (deposits + refunds)
            vi.mocked(db.select).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ total: 20000 }]),
                }),
            } as unknown as ReturnType<typeof db.select>);

            // Mock debits query (spends)
            vi.mocked(db.select).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ total: 5000 }]),
                }),
            } as unknown as ReturnType<typeof db.select>);

            const result = await calculateBalanceFromTransactions('wallet_abc');

            // Balance = 20000 (credits) - 5000 (debits) = 15000
            expect(result).toBe(15000);
        });

        it('should return 0 for wallet with no transactions', async () => {
            // Mock credits query - no transactions
            vi.mocked(db.select).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ total: 0 }]),
                }),
            } as unknown as ReturnType<typeof db.select>);

            // Mock debits query - no transactions
            vi.mocked(db.select).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ total: 0 }]),
                }),
            } as unknown as ReturnType<typeof db.select>);

            const result = await calculateBalanceFromTransactions('wallet_empty');

            expect(result).toBe(0);
        });
    });

    describe('getWalletStats (Story 5.3)', () => {
        it('should return zero balance and neutral trend if no wallet exists', async () => {
            vi.mocked(db.query.wallets.findFirst).mockResolvedValue(undefined);

            // Import dynamically after mocks are set up
            const { getWalletStats } = await import('../wallet');
            const result = await getWalletStats('user_no_wallet');

            expect(result.balance).toBe(0);
            expect(result.trend.direction).toBe('neutral');
            expect(result.trend.label).toBe('No wallet yet');
        });

        it('should return neutral trend when no funding activity', async () => {
            const mockWallet = {
                id: 'wallet_abc',
                userId: 'user_123',
                balance: 5000,
                currency: 'NGN',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(db.query.wallets.findFirst).mockResolvedValue(mockWallet);

            // Mock current month deposits = 0
            vi.mocked(db.select).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ total: 0 }]),
                }),
            } as unknown as ReturnType<typeof db.select>);

            // Mock previous month deposits = 0
            vi.mocked(db.select).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ total: 0 }]),
                }),
            } as unknown as ReturnType<typeof db.select>);

            const { getWalletStats } = await import('../wallet');
            const result = await getWalletStats('user_123');

            expect(result.balance).toBe(5000);
            expect(result.trend.direction).toBe('neutral');
            expect(result.trend.label).toBe('No funding activity');
        });

        it('should return up trend for first month with deposits', async () => {
            const mockWallet = {
                id: 'wallet_abc',
                userId: 'user_123',
                balance: 10000,
                currency: 'NGN',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(db.query.wallets.findFirst).mockResolvedValue(mockWallet);

            // Mock current month deposits = 10000
            vi.mocked(db.select).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ total: 10000 }]),
                }),
            } as unknown as ReturnType<typeof db.select>);

            // Mock previous month deposits = 0
            vi.mocked(db.select).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ total: 0 }]),
                }),
            } as unknown as ReturnType<typeof db.select>);

            const { getWalletStats } = await import('../wallet');
            const result = await getWalletStats('user_123');

            expect(result.balance).toBe(10000);
            expect(result.trend.direction).toBe('up');
            expect(result.trend.percentage).toBe(100);
            expect(result.trend.label).toBe('First funding this month!');
        });

        it('should calculate positive trend percentage correctly', async () => {
            const mockWallet = {
                id: 'wallet_abc',
                userId: 'user_123',
                balance: 25000,
                currency: 'NGN',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(db.query.wallets.findFirst).mockResolvedValue(mockWallet);

            // Mock current month deposits = 15000
            vi.mocked(db.select).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ total: 15000 }]),
                }),
            } as unknown as ReturnType<typeof db.select>);

            // Mock previous month deposits = 10000
            vi.mocked(db.select).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ total: 10000 }]),
                }),
            } as unknown as ReturnType<typeof db.select>);

            const { getWalletStats } = await import('../wallet');
            const result = await getWalletStats('user_123');

            expect(result.balance).toBe(25000);
            expect(result.trend.direction).toBe('up');
            expect(result.trend.percentage).toBe(50); // (15000-10000)/10000 * 100 = 50%
            expect(result.trend.label).toBe('+50% this month');
        });

        it('should calculate negative trend percentage correctly', async () => {
            const mockWallet = {
                id: 'wallet_abc',
                userId: 'user_123',
                balance: 5000,
                currency: 'NGN',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(db.query.wallets.findFirst).mockResolvedValue(mockWallet);

            // Mock current month deposits = 5000
            vi.mocked(db.select).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ total: 5000 }]),
                }),
            } as unknown as ReturnType<typeof db.select>);

            // Mock previous month deposits = 10000
            vi.mocked(db.select).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ total: 10000 }]),
                }),
            } as unknown as ReturnType<typeof db.select>);

            const { getWalletStats } = await import('../wallet');
            const result = await getWalletStats('user_123');

            expect(result.balance).toBe(5000);
            expect(result.trend.direction).toBe('down');
            expect(result.trend.percentage).toBe(50); // |5000-10000|/10000 * 100 = 50%
            expect(result.trend.label).toBe('-50% this month');
        });
    });
});
