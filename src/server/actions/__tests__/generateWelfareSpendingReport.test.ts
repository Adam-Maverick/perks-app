import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the action
vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(),
}));

vi.mock('@/db', () => ({
    db: {
        query: {
            employers: {
                findFirst: vi.fn(),
            },
            organizations: {
                findFirst: vi.fn(),
            },
        },
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn(),
    },
}));

vi.mock('@/server/procedures/tax/calculate-welfare-spend', () => ({
    calculateWelfareSpending: vi.fn(),
}));

vi.mock('@/lib/pdf-generator', () => ({
    renderWelfareReportPdf: vi.fn(),
}));

vi.mock('@/lib/csv-generator', () => ({
    generateWelfareReportCSV: vi.fn(),
}));

vi.mock('@vercel/blob', () => ({
    put: vi.fn(),
}));

import { generateWelfareSpendingReport } from '../generateWelfareSpendingReport';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { calculateWelfareSpending } from '@/server/procedures/tax/calculate-welfare-spend';
import { renderWelfareReportPdf } from '@/lib/pdf-generator';
import { generateWelfareReportCSV } from '@/lib/csv-generator';
import { put } from '@vercel/blob';

describe('generateWelfareSpendingReport', () => {
    const validInput = {
        organizationId: 'org_test123',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        format: 'pdf' as const,
    };

    const mockUser = { userId: 'user_admin123' };
    const mockEmployer = { userId: 'user_admin123', organizationId: 'org_test123', role: 'admin' };
    const mockOrg = { id: 'org_test123', name: 'Test Corp' };
    const mockReport = {
        organizationId: 'org_test123',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        totalFunded: 5000000,
        totalSpent: 3000000,
        taxDeduction: 4500000,
        estimatedTaxSavings: 1350000,
        employeeBreakdown: [],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Authentication', () => {
        it('should reject unauthenticated users', async () => {
            vi.mocked(auth).mockResolvedValue({ userId: null } as any);

            const result = await generateWelfareSpendingReport(validInput);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized. Please sign in.');
        });
    });

    describe('Authorization', () => {
        it('should reject non-admin users', async () => {
            vi.mocked(auth).mockResolvedValue(mockUser as any);
            vi.mocked(db.query.employers.findFirst).mockResolvedValue(null);

            const result = await generateWelfareSpendingReport(validInput);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Access denied. You must be an admin of this organization.');
        });

        it('should reject users from different organizations', async () => {
            vi.mocked(auth).mockResolvedValue(mockUser as any);
            vi.mocked(db.query.employers.findFirst).mockResolvedValue(null);

            const result = await generateWelfareSpendingReport({
                ...validInput,
                organizationId: 'org_different',
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Access denied. You must be an admin of this organization.');
        });
    });

    describe('Input Validation', () => {
        it('should reject invalid date format', async () => {
            vi.mocked(auth).mockResolvedValue(mockUser as any);

            const result = await generateWelfareSpendingReport({
                ...validInput,
                startDate: 'not-a-date',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid');
        });

        it('should reject if start date is after end date', async () => {
            vi.mocked(auth).mockResolvedValue(mockUser as any);
            vi.mocked(db.query.employers.findFirst).mockResolvedValue(mockEmployer as any);
            vi.mocked(db.query.organizations.findFirst).mockResolvedValue(mockOrg as any);

            const result = await generateWelfareSpendingReport({
                ...validInput,
                startDate: '2025-02-01',
                endDate: '2025-01-01',
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Start date must be before end date.');
        });

        it('should reject invalid format', async () => {
            vi.mocked(auth).mockResolvedValue(mockUser as any);

            const result = await generateWelfareSpendingReport({
                ...validInput,
                format: 'docx' as any,
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid');
        });
    });

    describe('Successful Generation', () => {
        beforeEach(() => {
            vi.mocked(auth).mockResolvedValue(mockUser as any);
            vi.mocked(db.query.employers.findFirst).mockResolvedValue(mockEmployer as any);
            vi.mocked(db.query.organizations.findFirst).mockResolvedValue(mockOrg as any);
            vi.mocked(calculateWelfareSpending).mockResolvedValue(mockReport);
            vi.mocked(renderWelfareReportPdf).mockResolvedValue(Buffer.from('pdf-content'));
            vi.mocked(generateWelfareReportCSV).mockReturnValue('csv-content');
            vi.mocked(put).mockResolvedValue({ url: 'https://blob.url/report.pdf' } as any);
            vi.mocked(db.insert).mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'report_123' }]),
                }),
            } as any);
        });

        it('should generate PDF report successfully', async () => {
            const result = await generateWelfareSpendingReport(validInput);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.url).toBe('https://blob.url/report.pdf');
            expect(result.data?.summary.totalSpent).toBe(3000000);
            expect(result.data?.summary.taxDeduction).toBe(4500000);
        });

        it('should generate CSV report successfully', async () => {
            const result = await generateWelfareSpendingReport({
                ...validInput,
                format: 'csv',
            });

            expect(result.success).toBe(true);
            expect(generateWelfareReportCSV).toHaveBeenCalled();
        });

        it('should log report to database for audit', async () => {
            await generateWelfareSpendingReport(validInput);

            expect(db.insert).toHaveBeenCalled();
        });
    });
});
