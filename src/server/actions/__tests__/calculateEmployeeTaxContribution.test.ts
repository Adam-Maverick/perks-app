import { calculateEmployeeTaxContribution } from '../calculateEmployeeTaxContribution';
import { db } from '@/db';
import { auth } from '@clerk/nextjs/server';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    from: vi.fn(),
    where: vi.fn(),
    and: vi.fn(),
    isNotNull: vi.fn(),
    eq: vi.fn(),
  },
}));

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

describe('calculateEmployeeTaxContribution', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation: authenticated as mockUserId
    (auth as any).mockResolvedValue({ userId: mockUserId });
  });

  it('should calculate tax contribution correctly for user with stipend transactions', async () => {
    // Mock database response: 2 transactions totaling ₦30,000 (30,000 kobo)
    const mockTransactions = [
      { amount: 1500000 }, // ₦15,000
      { amount: 1500000 }, // ₦15,000
    ];

    const mockWhere = vi.fn().mockResolvedValue(mockTransactions);
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    (db.select as any).mockImplementation(mockSelect);

    const result = await calculateEmployeeTaxContribution({ userId: mockUserId });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      taxSavings: 13500, // (30,000 * 1.5 * 0.3) = 13,500
      totalSpent: 30000, // 3,000,000 / 100 = 30,000
    });
  });

  it('should return zero for user with no stipend transactions', async () => {
    const mockTransactions: any[] = [];

    const mockWhere = vi.fn().mockResolvedValue(mockTransactions);
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    (db.select as any).mockImplementation(mockSelect);

    const result = await calculateEmployeeTaxContribution({ userId: mockUserId });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      taxSavings: 0,
      totalSpent: 0,
    });
  });

  it('should return unauthorized error if not authenticated', async () => {
    (auth as any).mockResolvedValue({ userId: null });

    const result = await calculateEmployeeTaxContribution({ userId: mockUserId });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('should return unauthorized error if trying to access another users data', async () => {
    (auth as any).mockResolvedValue({ userId: 'other-user-id' });

    const result = await calculateEmployeeTaxContribution({ userId: mockUserId });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('should handle database errors gracefully', async () => {
    const mockWhere = vi.fn().mockRejectedValue(new Error('Database connection failed'));
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    (db.select as any).mockImplementation(mockSelect);

    const result = await calculateEmployeeTaxContribution({ userId: mockUserId });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to calculate tax contribution');
  });

  it('should validate input and reject invalid userId', async () => {
    // Note: Zod validation happens AFTER auth check in the implementation
    // But since empty string is invalid, the initial auth check will pass (requesterId exists)
    // Then Zod throws, which the catch block handles.

    const result = await calculateEmployeeTaxContribution({ userId: '' });

    // The current implementation catches ZodError and returns "Invalid input: ..."
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid input');
  });

  it('should calculate correct tax savings with different amounts', async () => {
    // Mock: ₦50,000 spent
    const mockTransactions = [
      { amount: 5000000 }, // ₦50,000
    ];

    const mockWhere = vi.fn().mockResolvedValue(mockTransactions);
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    (db.select as any).mockImplementation(mockSelect);

    const result = await calculateEmployeeTaxContribution({ userId: mockUserId });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      taxSavings: 22500, // (50,000 * 1.5 * 0.3) = 22,500
      totalSpent: 50000,
    });
  });
});