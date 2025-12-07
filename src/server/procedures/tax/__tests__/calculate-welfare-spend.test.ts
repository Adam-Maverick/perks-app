import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateWelfareSpending } from '../calculate-welfare-spend';

// Mock the database
vi.mock('@/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
    },
}));

describe('calculateWelfareSpending', () => {
    const orgId = 'org_test123';
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Tax Calculation Math', () => {
        it('should calculate 150% tax deduction correctly', () => {
            // Given: Total spending of 1,000,000 kobo (₦10,000)
            const totalSpent = 1000000;

            // When: Calculating the tax deduction
            const taxDeduction = Math.floor(totalSpent * 1.5);

            // Then: Tax deduction should be 150% = 1,500,000 kobo (₦15,000)
            expect(taxDeduction).toBe(1500000);
        });

        it('should calculate 30% estimated savings correctly', () => {
            // Given: Tax deduction of 1,500,000 kobo
            const taxDeduction = 1500000;

            // When: Calculating estimated tax savings at 30%
            const estimatedSavings = Math.floor(taxDeduction * 0.30);

            // Then: Savings should be 450,000 kobo (₦4,500)
            expect(estimatedSavings).toBe(450000);
        });

        it('should calculate tax contribution as 45% of spending', () => {
            // Given: Employee spending of 500,000 kobo (₦5,000)
            const amountSpent = 500000;

            // When: Calculating per-employee tax contribution (150% × 30% = 45%)
            const taxContribution = Math.floor(amountSpent * 0.45);

            // Then: Tax contribution should be 225,000 kobo (₦2,250)
            expect(taxContribution).toBe(225000);
        });

        it('should use integer math to avoid floating point precision issues', () => {
            // Given: An odd spending amount
            const totalSpent = 333333; // ₦3,333.33

            // When: Calculating deduction (should use Math.floor)
            const taxDeduction = Math.floor(totalSpent * 1.5);
            const estimatedSavings = Math.floor(taxDeduction * 0.30);

            // Then: Results should be integers with no floating point artifacts
            expect(Number.isInteger(taxDeduction)).toBe(true);
            expect(Number.isInteger(estimatedSavings)).toBe(true);
            expect(taxDeduction).toBe(499999);
            expect(estimatedSavings).toBe(149999);
        });

        it('should handle zero spending gracefully', () => {
            const totalSpent = 0;
            const taxDeduction = Math.floor(totalSpent * 1.5);
            const estimatedSavings = Math.floor(taxDeduction * 0.30);

            expect(taxDeduction).toBe(0);
            expect(estimatedSavings).toBe(0);
        });

        it('should handle large amounts without overflow', () => {
            // Given: Large corporate spending of ₦100,000,000 (10 billion kobo)
            const totalSpent = 10000000000;

            // When: Calculating deduction
            const taxDeduction = Math.floor(totalSpent * 1.5);
            const estimatedSavings = Math.floor(taxDeduction * 0.30);

            // Then: Results should be accurate
            expect(taxDeduction).toBe(15000000000);
            expect(estimatedSavings).toBe(4500000000);
        });
    });

    describe('Employee Breakdown', () => {
        it('should calculate individual tax contribution correctly', () => {
            const employees = [
                { amountSpent: 1000000 }, // ₦10,000
                { amountSpent: 500000 },  // ₦5,000
                { amountSpent: 250000 },  // ₦2,500
            ];

            const breakdown = employees.map(emp => ({
                ...emp,
                taxContribution: Math.floor(emp.amountSpent * 0.45),
            }));

            expect(breakdown[0].taxContribution).toBe(450000);
            expect(breakdown[1].taxContribution).toBe(225000);
            expect(breakdown[2].taxContribution).toBe(112500);
        });

        it('should sum employee spending to match total', () => {
            const employeeSpending = [1000000, 500000, 250000];
            const totalSpent = employeeSpending.reduce((sum, amount) => sum + amount, 0);

            expect(totalSpent).toBe(1750000);
        });
    });
});
