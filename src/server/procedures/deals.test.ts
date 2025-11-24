import { describe, it, expect } from 'vitest';
import { getDealsByCategory, getAllCategories } from './deals';

describe('getDealsByCategory', () => {
    it('should return all active deals when no category specified', async () => {
        const results = await getDealsByCategory();
        expect(Array.isArray(results)).toBe(true);
        // All results should have validUntil > now and inventoryCount > 0
        results.forEach(deal => {
            expect(deal.validUntil).toBeTruthy();
            expect(deal.inventoryCount).toBeGreaterThan(0);
        });
    });

    it('should filter deals by category slug', async () => {
        const results = await getDealsByCategory('food');
        expect(Array.isArray(results)).toBe(true);
        // All results should be from Food category
        results.forEach(deal => {
            expect(deal.category.slug).toBe('food');
        });
    });

    it('should include merchant and category details', async () => {
        const results = await getDealsByCategory();
        if (results.length > 0) {
            const deal = results[0];
            expect(deal.merchant).toBeDefined();
            expect(deal.merchant.name).toBeTruthy();
            expect(deal.merchant.trustLevel).toMatch(/VERIFIED|EMERGING/);
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
