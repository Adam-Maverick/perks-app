import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transferEmployer } from './transfer-employer';
import { db } from '@/db';

// Mock dependencies
vi.mock('@/db', () => ({
    db: {
        query: {
            employees: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
            },
            invitations: {
                findFirst: vi.fn(),
            },
            organizations: {
                findFirst: vi.fn(),
            },
            users: {
                findFirst: vi.fn(),
            },
            employers: {
                findMany: vi.fn(),
            },
        },
        update: vi.fn(() => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(undefined),
        })),
        insert: vi.fn(() => ({
            values: vi.fn().mockResolvedValue(undefined),
        })),
    },
}));

vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(),
}));

vi.mock('next/headers', () => ({
    headers: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue('127.0.0.1'),
    }),
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

import { auth } from '@clerk/nextjs/server';

describe('transferEmployer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fail if user is not logged in', async () => {
        vi.mocked(auth).mockResolvedValue({ userId: null } as any);
        const result = await transferEmployer('CODE123');
        expect(result.success).toBe(false);
        expect(result.error).toContain('must be logged in');
    });

    it('should fail if employee record not found', async () => {
        vi.mocked(auth).mockResolvedValue({ userId: 'user_1' } as any);
        vi.mocked(db.query.employees.findFirst).mockResolvedValue(undefined);

        const result = await transferEmployer('CODE123');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Employee record not found');
    });

    it('should fail if invitation code is invalid', async () => {
        vi.mocked(auth).mockResolvedValue({ userId: 'user_1' } as any);
        vi.mocked(db.query.employees.findFirst).mockResolvedValue({ organizationId: 'org_old' } as any);
        vi.mocked(db.query.invitations.findFirst).mockResolvedValue(undefined);

        const result = await transferEmployer('INVALID');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid or expired invitation code');
    });

    it('should fail if transferring to same organization', async () => {
        vi.mocked(auth).mockResolvedValue({ userId: 'user_1' } as any);
        vi.mocked(db.query.employees.findFirst).mockResolvedValue({ organizationId: 'org_1' } as any);
        vi.mocked(db.query.invitations.findFirst).mockResolvedValue({ employerId: 'org_1' } as any);

        const result = await transferEmployer('CODE123');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Cannot transfer to the same organization');
    });

    it('should succeed with valid inputs', async () => {
        vi.mocked(auth).mockResolvedValue({ userId: 'user_1' } as any);

        // Mock DB responses
        vi.mocked(db.query.employees.findFirst).mockResolvedValue({ organizationId: 'org_old' } as any);
        vi.mocked(db.query.invitations.findFirst).mockResolvedValue({ id: 'inv_1', employerId: 'org_new' } as any);
        vi.mocked(db.query.organizations.findFirst)
            .mockResolvedValueOnce({ id: 'org_old', name: 'Old Corp' } as any)
            .mockResolvedValueOnce({ id: 'org_new', name: 'New Corp' } as any);

        vi.mocked(db.query.users.findFirst).mockResolvedValue({ email: 'user@example.com', firstName: 'John' } as any);
        vi.mocked(db.query.employers.findMany).mockResolvedValue([{ user: { email: 'admin@example.com' } }] as any);

        const result = await transferEmployer('CODE123');

        expect(result.success).toBe(true);
        expect(result.data?.newEmployerName).toBe('New Corp');
        expect(db.update).toHaveBeenCalled();
        expect(db.insert).toHaveBeenCalled();
    });
});
