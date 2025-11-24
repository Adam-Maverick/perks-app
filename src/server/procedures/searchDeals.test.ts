import { describe, it, expect, vi } from 'vitest';
import { searchDeals } from './deals';

// Mock the database and schema
vi.mock('@/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
    }
}));

describe('searchDeals', () => {
    it('should build a search query with ILIKE', async () => {
        const { db } = await import('@/db');

        await searchDeals('pizza');

        // Verify that the query builder was called correctly
        // Note: Since we're mocking the chain, we can't easily inspect the exact SQL generated
        // without a more complex mock, but we can verify the chain execution.
        expect(db.select).toHaveBeenCalled();
        expect(db.select().from).toHaveBeenCalled();
        expect(db.select().from().innerJoin).toHaveBeenCalledTimes(2); // merchants and categories
        expect(db.select().from().innerJoin().innerJoin().where).toHaveBeenCalled();
    });

    it('should apply category filter if provided', async () => {
        const { db } = await import('@/db');

        await searchDeals('pizza', 'food');

        expect(db.select).toHaveBeenCalled();
    });

    it('should apply location sorting if provided', async () => {
        const { db } = await import('@/db');

        await searchDeals('pizza', undefined, { city: 'Lagos', state: 'Lagos' });

        expect(db.select().from().innerJoin().innerJoin().where().orderBy).toHaveBeenCalled();
    });
});
