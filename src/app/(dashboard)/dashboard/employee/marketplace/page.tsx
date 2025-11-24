import { Suspense } from "react";
import { Metadata } from "next";
import { CategoryFilter } from "@/components/modules/marketplace/CategoryFilter";
import { DealCard } from "@/components/modules/marketplace/DealCard";
import { DealCardSkeleton } from "@/components/modules/marketplace/DealCardSkeleton";
import { getDealsByCategory, getAllCategories } from "@/server/procedures/deals";

export const metadata: Metadata = {
    title: "Marketplace | Stipends",
    description: "Discover verified merchants and exclusive deals.",
};

interface MarketplacePageProps {
    searchParams: Promise<{ category?: string }>;
}

async function DealsGrid({ categorySlug }: { categorySlug?: string }) {
    const deals = await getDealsByCategory(categorySlug);

    if (deals.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                    No deals found in this category.
                    {categorySlug && " Try selecting 'All' to see all available deals."}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
            ))}
        </div>
    );
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
    const params = await searchParams;
    const categorySlug = params.category;
    const categories = await getAllCategories();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="font-outfit text-3xl font-bold text-electric-royal-blue">
                    Marketplace
                </h1>
                <p className="mt-2 text-gray-600">
                    Discover trusted brands and exclusive deals curated for you.
                </p>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
                <CategoryFilter categories={categories} />
            </div>

            {/* Deals Grid with Suspense */}
            <Suspense
                key={categorySlug || 'all'}
                fallback={
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <DealCardSkeleton key={i} />
                        ))}
                    </div>
                }
            >
                <DealsGrid categorySlug={categorySlug} />
            </Suspense>
        </div>
    );
}
