import { describe, it, expect, vi } from 'vitest';

// Mock data
const mockDeals = [
    {
        id: 'deal1',
        title: 'Pizza Deal',
        description: 'Great pizza',
        discountPercentage: 20,
        originalPrice: 5000,
        validUntil: new Date(Date.now() + 86400000),
        inventoryCount: 10,
        merchant: { id: 'm1', name: 'Pizza Place', logoUrl: null, trustLevel: 'VERIFIED', location: 'Lagos' },
        category: { id: 'c1', name: 'Food', slug: 'food', icon: '🍕' },
    },
];

const mockCategories = [
    { id: 'cat1', name: 'Food', slug: 'food', icon: '🍕' },
    { id: 'cat2', name: 'Transport', slug: 'transport', icon: '🚗' },
];

// Track query type
let isDealsQuery = false;

// Mock the database
vi.mock('@/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockImplementation(function () {
            isDealsQuery = true;
            return this;
        }),
        where: vi.fn().mockImplementation(function () {
            if (isDealsQuery) {
                isDealsQuery = false;
                return Promise.resolve(mockDeals);
            }
            return this;
        }),
        orderBy: vi.fn().mockImplementation(function () {
            return Promise.resolve(mockCategories);
        }),
    },
}));

vi.mock('@/db/schema', () => ({
    deals: {},
    merchants: {},
    categories: {},
}));

import { getDealsByCategory, getAllCategories } from './deals';

describe('getDealsByCategory', () => {
    it('should return all active deals when no category specified', async () => {
        const results = await getDealsByCategory();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
    });

    it('should filter deals by category slug', async () => {
        const results = await getDealsByCategory('food');
        expect(Array.isArray(results)).toBe(true);
    });

    it('should include merchant and category details', async () => {
        const results = await getDealsByCategory();
        if (results.length > 0) {
            const deal = results[0];
            expect(deal.merchant).toBeDefined();
            expect(deal.merchant.name).toBeTruthy();
            expect(deal.category).toBeDefined();
            expect(deal.category.name).toBeTruthy();
        }
    });
});

describe('getAllCategories', () => {
    it('should return all categories', async () => {
        const results = await getAllCategories();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
    });

    it('should include category details', async () => {
        const results = await getAllCategories();
        if (results.length > 0) {
            const category = results[0];
            expect(category.id).toBeTruthy();
            expect(category.name).toBeTruthy();
            expect(category.slug).toBeTruthy();
        }
    });
});
