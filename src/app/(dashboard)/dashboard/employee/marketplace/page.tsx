import { Suspense } from "react";
import { Metadata } from "next";
import { CategoryFilter } from "@/components/modules/marketplace/CategoryFilter";
import { DealCard } from "@/components/modules/marketplace/DealCard";
import { DealCardSkeleton } from "@/components/modules/marketplace/DealCardSkeleton";
import { SearchBar } from "@/components/modules/marketplace/SearchBar";
import { EmptySearchState } from "@/components/modules/marketplace/EmptySearchState";
import { MarketplaceClientWrapper } from "@/components/modules/marketplace/MarketplaceClientWrapper";
import { getDealsByCategory, getAllCategories, searchDeals } from "@/server/procedures/deals";

export const metadata: Metadata = {
    title: "Marketplace | Stipends",
    description: "Discover verified merchants and exclusive deals.",
};

interface MarketplacePageProps {
    searchParams: Promise<{ category?: string; q?: string; city?: string; state?: string }>;
}

async function DealsGrid({
    categorySlug,
    query,
    location
}: {
    categorySlug?: string;
    query?: string;
    location?: { city: string | null; state: string | null };
}) {
    let deals;

    if (query) {
        // If there's a search query, use searchDeals (which also handles category filter)
        deals = await searchDeals(query, categorySlug, location);
    } else {
        // Otherwise use standard category listing
        deals = await getDealsByCategory(categorySlug);
    }

    if (deals.length === 0) {
        if (query) {
            return <EmptySearchState query={query} />;
        }

        return (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                    No deals found in this category.
                    {categorySlug && " Try selecting 'All' to see all available deals."}
                </p>
            </div>
        );
    }

    return <MarketplaceClientWrapper deals={deals} />;
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
    const params = await searchParams;
    const categorySlug = params.category;
    const query = params.q;
    const city = params.city || null;
    const state = params.state || null;

    const categories = await getAllCategories();

    return (
        <>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="font-outfit text-3xl font-bold text-electric-royal-blue">
                            Marketplace
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Discover trusted brands and exclusive deals curated for you.
                        </p>
                    </div>
                    <SearchBar initialQuery={query} />
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                    <CategoryFilter categories={categories} />
                </div>

                {/* Deals Grid with Suspense */}
                <Suspense
                    key={`${categorySlug || 'all'}-${query || 'none'}-${city || 'no-city'}`}
                    fallback={
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <DealCardSkeleton key={i} />
                            ))}
                        </div>
                    }
                >
                    <DealsGrid
                        categorySlug={categorySlug}
                        query={query}
                        location={city || state ? { city, state } : undefined}
                    />
                </Suspense>
            </div>
        </>
    );
}
