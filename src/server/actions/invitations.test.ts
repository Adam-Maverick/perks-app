import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateInvitationCode } from './invitations';
import { db } from '@/db';
import { invitations, organizations } from '@/db/schema';

// Mock DB
vi.mock('@/db', () => ({
    db: {
        query: {
            invitations: {
                findFirst: vi.fn(),
            },
            organizations: {
                findFirst: vi.fn(),
            },
        },
    },
}));

describe('validateInvitationCode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return error for invalid code', async () => {
        vi.mocked(db.query.invitations.findFirst).mockResolvedValue(undefined);

        const result = await validateInvitationCode('INVALID');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid or expired invitation code.');
    });

    it('should return success for valid code', async () => {
        const mockInvitation = {
            id: 'inv-1',
            code: 'VALID',
            employerId: 'org-1',
            usedAt: null,
            expiresAt: new Date(Date.now() + 10000), // Future
        };
        const mockOrg = {
            id: 'org-1',
            name: 'Test Corp',
        };

        vi.mocked(db.query.invitations.findFirst).mockResolvedValue(mockInvitation as any);
        vi.mocked(db.query.organizations.findFirst).mockResolvedValue(mockOrg as any);

        const result = await validateInvitationCode('VALID');
        expect(result.success).toBe(true);
        expect(result.data).toEqual({
            employerName: 'Test Corp',
            employerId: 'org-1',
        });
    });

    it('should return error for used code', async () => {
        // Note: The query in implementation filters out usedAt, so findFirst returns null
        vi.mocked(db.query.invitations.findFirst).mockResolvedValue(undefined);

        const result = await validateInvitationCode('USED');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid or expired invitation code.');
    });

    // Rate limiting test is harder with in-memory map in module scope without exposing it
    // We can test it by calling multiple times
    it('should rate limit after 5 attempts', async () => {
        vi.mocked(db.query.invitations.findFirst).mockResolvedValue(undefined);
        const ip = '127.0.0.1';

        // 5 allowed attempts
        for (let i = 0; i < 5; i++) {
            await validateInvitationCode('INVALID', ip);
        }

        // 6th attempt
        const result = await validateInvitationCode('INVALID', ip);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Too many attempts. Please try again later.');
    });
});
