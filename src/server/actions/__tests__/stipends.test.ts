// Stipends Server Actions Tests
// Following CONTRIBUTING.md: Do NOT import vitest primitives - globals enabled

vi.stubEnv('PAYSTACK_SECRET_KEY', 'sk_test_mock_key');
vi.stubEnv('RESEND_API_KEY', 'test_resend_key');
vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

import {
    initiateFundingPayment,
    fundStipends,
    getOrganizationEmployees,
    verifyAndFundStipends,
} from '../stipends';

// Mock dependencies
vi.mock('@/db', () => ({
    db: {
        query: {
            users: {
                findFirst: vi.fn(),
            },
            walletTransactions: {
                findFirst: vi.fn(),
            },
            employees: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
            },
        },
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                leftJoin: vi.fn(() => ({
                    where: vi.fn(),
                })),
                where: vi.fn(),
            })),
        })),
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
        transaction: vi.fn(),
    },
}));

vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(),
}));

vi.mock('@/server/procedures/wallet', () => ({
    getOrCreateWallet: vi.fn(),
    updateWalletBalance: vi.fn(),
}));

vi.mock('resend', () => {
    return {
        Resend: class {
            emails = {
                send: vi.fn().mockResolvedValue({ id: 'email-id' }),
            };
        },
    };
});

// Mock fetch globally
global.fetch = vi.fn();

// Test data
const mockEmployeeId = '123e4567-e89b-12d3-a456-426614174000';
const mockUserId = 'user_2test123';
const mockOrgId = 'org_test123';

const mockEmployee = {
    id: mockEmployeeId,
    userId: mockUserId,
    email: 'employee@test.com',
    organizationId: mockOrgId,
    status: 'active',
};

const mockUser = {
    id: mockUserId,
    email: 'employer@test.com',
    firstName: 'Test',
    lastName: 'Employer',
};

const mockWallet = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    userId: mockUserId,
    balance: 0,
    currency: 'NGN',
};

describe('Stipends Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('initiateFundingPayment', () => {
        it('should fail without authentication', async () => {
            const { auth } = await import('@clerk/nextjs/server');
            vi.mocked(auth).mockResolvedValue({ userId: null, orgId: null });

            const result = await initiateFundingPayment([mockEmployeeId], 1000000);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Unauthorized');
        });

        it('should fail with invalid amount below minimum (500000 kobo = ₦5,000)', async () => {
            const { auth } = await import('@clerk/nextjs/server');
            vi.mocked(auth).mockResolvedValue({ userId: mockUserId, orgId: mockOrgId });

            const result = await initiateFundingPayment([mockEmployeeId], 100000); // ₦1,000

            expect(result.success).toBe(false);
            expect(result.error).toContain('Minimum amount');
        });

        it('should fail with invalid amount above maximum (5000000 kobo = ₦50,000)', async () => {
            const { auth } = await import('@clerk/nextjs/server');
            vi.mocked(auth).mockResolvedValue({ userId: mockUserId, orgId: mockOrgId });

            const result = await initiateFundingPayment([mockEmployeeId], 6000000); // ₦60,000

            expect(result.success).toBe(false);
            expect(result.error).toContain('Maximum amount');
        });

        it('should fail with empty employee list', async () => {
            const { auth } = await import('@clerk/nextjs/server');
            vi.mocked(auth).mockResolvedValue({ userId: mockUserId, orgId: mockOrgId });

            const result = await initiateFundingPayment([], 1000000);

            expect(result.success).toBe(false);
            expect(result.error).toContain('At least one employee');
        });

        it('should successfully initialize Paystack payment', async () => {
            const { auth } = await import('@clerk/nextjs/server');
            const { db } = await import('@/db');

            vi.mocked(auth).mockResolvedValue({ userId: mockUserId, orgId: mockOrgId });

            // Mock employee lookup
            vi.mocked(db.select).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ id: mockEmployeeId, userId: mockUserId }]),
                }),
            } as any);

            // Mock user lookup
            vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);

            // Mock Paystack response
            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    status: true,
                    data: {
                        authorization_url: 'https://checkout.paystack.com/test',
                        reference: 'test_ref',
                    },
                }),
            } as Response);

            const result = await initiateFundingPayment([mockEmployeeId], 1000000); // ₦10,000

            expect(result.success).toBe(true);
            expect(result.data?.authorizationUrl).toContain('paystack.com');
        });
    });

    describe('fundStipends', () => {
        it('should handle idempotency - skip if reference already processed', async () => {
            const { db } = await import('@/db');

            // Mock existing transaction with same reference
            vi.mocked(db.query.walletTransactions.findFirst).mockResolvedValue({
                id: 'existing-tx-id',
                referenceId: 'test_reference',
            });

            const result = await fundStipends([mockEmployeeId], 1000000, 'test_reference');

            expect(result.success).toBe(true);
            expect(result.data?.fundedCount).toBe(0); // Already processed
        });

        it('should fail with invalid amount', async () => {
            const result = await fundStipends([mockEmployeeId], 100000, 'test_reference'); // Below min

            expect(result.success).toBe(false);
            expect(result.error).toContain('Minimum amount');
        });

        it('should successfully fund employee wallets', async () => {
            const { db } = await import('@/db');
            const { getOrCreateWallet } = await import('@/server/procedures/wallet');

            // Mock no existing transaction
            vi.mocked(db.query.walletTransactions.findFirst).mockResolvedValue(null);

            // Mock employee lookup
            vi.mocked(db.select).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([mockEmployee]),
                }),
            } as any);

            // Mock wallet creation
            vi.mocked(getOrCreateWallet).mockResolvedValue(mockWallet);

            // Mock transaction
            vi.mocked(db.transaction).mockImplementation(async (callback: any) => {
                await callback({
                    insert: vi.fn(() => ({
                        values: vi.fn(),
                    })),
                    update: vi.fn(() => ({
                        set: vi.fn(() => ({
                            where: vi.fn(),
                        })),
                    })),
                });
            });

            const result = await fundStipends([mockEmployeeId], 1000000, 'unique_reference');

            expect(result.success).toBe(true);
            expect(result.data?.fundedCount).toBe(1);
        });
    });

    describe('getOrganizationEmployees', () => {
        it('should fail without authentication', async () => {
            const { auth } = await import('@clerk/nextjs/server');
            vi.mocked(auth).mockResolvedValue({ userId: null, orgId: null });

            const result = await getOrganizationEmployees();

            expect(result.success).toBe(false);
            expect(result.error).toContain('Unauthorized');
        });

        it('should return employees for authenticated org', async () => {
            const { auth } = await import('@clerk/nextjs/server');
            const { db } = await import('@/db');

            vi.mocked(auth).mockResolvedValue({ userId: mockUserId, orgId: mockOrgId });

            vi.mocked(db.select).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    leftJoin: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([
                            {
                                id: mockEmployeeId,
                                userId: mockUserId,
                                email: 'employee@test.com',
                                firstName: 'Test',
                                lastName: 'Employee',
                            },
                        ]),
                    }),
                }),
            } as any);

            const result = await getOrganizationEmployees();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data?.[0].email).toBe('employee@test.com');
        });
    });

    describe('verifyAndFundStipends', () => {
        it('should fail without authentication', async () => {
            const { auth } = await import('@clerk/nextjs/server');
            vi.mocked(auth).mockResolvedValue({ userId: null, orgId: null });

            const result = await verifyAndFundStipends('test_ref');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Unauthorized');
        });

        it('should fail if payment verification fails', async () => {
            const { auth } = await import('@clerk/nextjs/server');
            vi.mocked(auth).mockResolvedValue({ userId: mockUserId, orgId: mockOrgId });

            vi.mocked(global.fetch).mockResolvedValue({
                ok: false,
                json: vi.fn().mockResolvedValue({ status: false }),
            } as Response);

            const result = await verifyAndFundStipends('test_ref');

            expect(result.success).toBe(false);
            expect(result.error).toContain('verification failed');
        });

        it('should fail if organization mismatch', async () => {
            const { auth } = await import('@clerk/nextjs/server');
            vi.mocked(auth).mockResolvedValue({ userId: mockUserId, orgId: mockOrgId });

            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    status: true,
                    data: {
                        status: 'success',
                        metadata: {
                            type: 'stipend_funding',
                            orgId: 'different_org', // Different org
                            employeeIds: mockEmployeeId,
                            amountPerEmployee: 1000000,
                        },
                    },
                }),
            } as Response);

            const result = await verifyAndFundStipends('test_ref');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Organization mismatch');
        });
    });
});
