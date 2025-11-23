import { db } from "@/db";
import { merchants, deals } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export async function getMerchantsWithDealCounts() {
    const results = await db
        .select({
            id: merchants.id,
            name: merchants.name,
            logoUrl: merchants.logoUrl,
            trustLevel: merchants.trustLevel,
            dealCount: count(deals.id),
        })
        .from(merchants)
        .leftJoin(deals, eq(merchants.id, deals.merchantId))
        .groupBy(merchants.id);

    return results;
}
