import { db } from "@/db";
import { deals, merchants, categories } from "@/db/schema";
import { eq, and, gt, ilike, or, desc, sql } from "drizzle-orm";

export async function searchDeals(
    query: string,
    categorySlug?: string,
    location?: { city: string | null; state: string | null }
) {
    const now = new Date();
    const searchTerm = `%${query}%`;

    // Build where conditions
    const conditions = [
        gt(deals.validUntil, now),
        gt(deals.inventoryCount, 0),
        or(
            ilike(deals.title, searchTerm),
            ilike(deals.description, searchTerm),
            ilike(merchants.name, searchTerm)
        )
    ];

    // Add category filter if provided
    if (categorySlug) {
        conditions.push(eq(categories.slug, categorySlug));
    }

    // Build order by clauses
    const orderByClauses = [];

    // If location is provided, prioritize merchants in the same city/state
    if (location?.city || location?.state) {
        // We use a CASE statement to prioritize matches
        // 1. Exact city match
        // 2. State match
        // 3. Others
        // Note: This is a simple text match for MVP since we don't have lat/long yet

        const cityMatch = location.city ? ilike(merchants.location, `%${location.city}%`) : sql`false`;
        const stateMatch = location.state ? ilike(merchants.location, `%${location.state}%`) : sql`false`;

        orderByClauses.push(desc(sql`CASE 
            WHEN ${cityMatch} THEN 2 
            WHEN ${stateMatch} THEN 1 
            ELSE 0 
        END`));
    }

    // Always sort by newness as secondary (or primary if no location)
    orderByClauses.push(desc(deals.createdAt));

    // Execute the query
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
                location: merchants.location,
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
        .where(and(...conditions))
        .orderBy(...orderByClauses);

    return results;
}

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
