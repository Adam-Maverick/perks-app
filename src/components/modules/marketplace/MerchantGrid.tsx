import { getMerchantsWithDealCounts } from "@/server/procedures/merchants";
import { MerchantCard } from "./MerchantCard";

export async function MerchantGrid() {
    const merchants = await getMerchantsWithDealCounts();

    if (merchants.length === 0) {
        return (
            <div className="col-span-full flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <p className="text-gray-500">No merchants found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {merchants.map((merchant) => (
                <MerchantCard
                    key={merchant.id}
                    id={merchant.id}
                    name={merchant.name}
                    logoUrl={merchant.logoUrl}
                    trustLevel={merchant.trustLevel}
                    dealCount={merchant.dealCount}
                />
            ))}
        </div>
    );
}
