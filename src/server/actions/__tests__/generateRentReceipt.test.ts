import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { generateRentReceipt } from '../generateRentReceipt';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(),
}));

vi.mock('@/db', () => ({
    db: {
        query: {
            users: {
                findFirst: vi.fn(),
            },
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(),
            })),
        })),
    },
}));

vi.mock('@/lib/rate-limit', () => ({
    actionRateLimiter: {
        limit: vi.fn(),
    },
}));

vi.mock('@vercel/blob', () => ({
    put: vi.fn(),
}));

vi.mock('@/lib/pdf-generator', () => ({
    renderRentReceiptPdf: vi.fn(),
}));

// Import mocked modules for type safety
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { actionRateLimiter } from '@/lib/rate-limit';
import { put } from '@vercel/blob';
import { renderRentReceiptPdf } from '@/lib/pdf-generator';

describe('generateRentReceipt', () => {
    const validInput = {
        landlordName: 'Test Landlord',
        propertyAddress: '123 Test Street, Lagos',
        rentAmount: 15000000, // ₦150,000 in kobo
        paymentDate: '2025-01-15',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should reject unauthenticated requests', async () => {
        (auth as Mock).mockResolvedValue({ userId: null });

        const result = await generateRentReceipt(validInput);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Unauthorized');
    });

    it('should reject invalid rent amount (too low)', async () => {
        (auth as Mock).mockResolvedValue({ userId: 'user_123' });
        (actionRateLimiter!.limit as Mock).mockResolvedValue({
            success: true,
            remaining: 4,
        });

        const result = await generateRentReceipt({
            ...validInput,
            rentAmount: 100000, // ₦1,000 - below minimum
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Minimum rent amount');
    });

    it('should reject invalid rent amount (too high)', async () => {
        (auth as Mock).mockResolvedValue({ userId: 'user_123' });
        (actionRateLimiter!.limit as Mock).mockResolvedValue({
            success: true,
            remaining: 4,
        });

        const result = await generateRentReceipt({
            ...validInput,
            rentAmount: 600000000, // ₦6M - above maximum
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Maximum rent amount');
    });

    it('should reject when rate limited', async () => {
        (auth as Mock).mockResolvedValue({ userId: 'user_123' });
        (actionRateLimiter!.limit as Mock).mockResolvedValue({
            success: false,
            remaining: 0,
        });

        const result = await generateRentReceipt(validInput);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Too many requests');
    });

    it('should successfully generate receipt with valid input', async () => {
        const mockUserId = 'user_123';
        const mockReceiptId = 'receipt_abc';
        const mockPdfUrl = 'https://blob.vercel.com/receipt.pdf';

        (auth as Mock).mockResolvedValue({ userId: mockUserId });
        (actionRateLimiter!.limit as Mock).mockResolvedValue({
            success: true,
            remaining: 4,
        });
        (db.query.users.findFirst as Mock).mockResolvedValue({
            id: mockUserId,
            firstName: 'Adam',
            lastName: 'Smith',
            email: 'adam@test.com',
        });
        (renderRentReceiptPdf as Mock).mockResolvedValue(Buffer.from('mock-pdf'));
        (put as Mock).mockResolvedValue({ url: mockPdfUrl });
        (db.insert as Mock).mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: mockReceiptId }]),
            }),
        });

        const result = await generateRentReceipt(validInput);

        expect(result.success).toBe(true);
        expect(result.data?.receiptId).toBe(mockReceiptId);
        expect(result.data?.pdfUrl).toBe(mockPdfUrl);
    });

    it('should return error when user not found in database', async () => {
        (auth as Mock).mockResolvedValue({ userId: 'user_123' });
        (actionRateLimiter!.limit as Mock).mockResolvedValue({
            success: true,
            remaining: 4,
        });
        (db.query.users.findFirst as Mock).mockResolvedValue(null);

        const result = await generateRentReceipt(validInput);

        expect(result.success).toBe(false);
        expect(result.error).toContain('User not found');
    });
});
