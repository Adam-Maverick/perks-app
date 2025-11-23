import { Suspense } from "react";
import { Metadata } from "next";
import { MerchantGrid } from "@/components/modules/marketplace/MerchantGrid";
import { MerchantCardSkeleton } from "@/components/modules/marketplace/MerchantCardSkeleton";

export const metadata: Metadata = {
    title: "Marketplace | Stipends",
    description: "Discover verified merchants and exclusive deals.",
};

export default function MarketplacePage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="font-outfit text-3xl font-bold text-[#2563EB]">
                    Marketplace
                </h1>
                <p className="mt-2 text-gray-600">
                    Discover trusted brands and exclusive deals curated for you.
                </p>
            </div>

            <Suspense
                fallback={
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <MerchantCardSkeleton key={i} />
                        ))}
                    </div>
                }
            >
                <MerchantGrid />
            </Suspense>
        </div>
    );
}
