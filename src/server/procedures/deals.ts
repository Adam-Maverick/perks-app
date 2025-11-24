import { db } from "@/db";
import { deals, merchants, categories } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function getDealsByCategory(categorySlug?: string) {
    const now = new Date();

    // Build where conditions
    const conditions = [
        gt(deals.validUntil, now),
        gt(deals.inventoryCount, 0)
    ];

    // Add category filter if provided
    if (categorySlug) {
        conditions.push(eq(categories.slug, categorySlug));
    }

    const results = await db
        .select({
            id: deals.id,
            title: deals.title,
            description: deals.description,
            discountPercentage: deals.discountPercentage,
            originalPrice: deals.originalPrice,
            validUntil: deals.validUntil,
            inventoryCount: deals.inventoryCount,
            merchant: {
                id: merchants.id,
                name: merchants.name,
                logoUrl: merchants.logoUrl,
                trustLevel: merchants.trustLevel,
            },
            category: {
                id: categories.id,
                name: categories.name,
                slug: categories.slug,
            },
        })
        .from(deals)
        .innerJoin(merchants, eq(deals.merchantId, merchants.id))
        .innerJoin(categories, eq(deals.categoryId, categories.id))
        .where(and(...conditions));

    return results;
}

export async function getAllCategories() {
    const results = await db
        .select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            icon: categories.icon,
        })
        .from(categories)
        .orderBy(categories.name);

    return results;
}
