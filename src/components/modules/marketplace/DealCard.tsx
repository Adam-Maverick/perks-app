import Image from 'next/image';
import Link from 'next/link';
import { TrustBadge, type TrustLevel } from './TrustBadge';

interface DealCardProps {
    deal: {
        id: string;
        title: string;
        discountPercentage: number | null;
        originalPrice: number;
        merchant: {
            name: string;
            logoUrl: string | null;
            trustLevel: TrustLevel;
        };
    };
    isOnline?: boolean;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, isOnline = true }) => {
    // Convert kobo to naira
    const priceInNaira = deal.originalPrice / 100;
    const formattedPrice = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
    }).format(priceInNaira);

    return (
        <Link
            href={`/dashboard/employee/marketplace/deals/${deal.id}`}
            className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
        >
            {/* Merchant Logo */}
            <div className="relative h-48 bg-gray-100">
                {deal.merchant.logoUrl ? (
                    <Image
                        src={deal.merchant.logoUrl}
                        alt={deal.merchant.name}
                        fill
                        className="object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <span className="text-4xl">🏪</span>
                    </div>
                )}
                {/* Discount Badge */}
                {deal.discountPercentage && (
                    <div className="absolute top-2 right-2 bg-electric-lime text-white px-3 py-1 rounded-full text-sm font-bold">
                        {deal.discountPercentage}% OFF
                    </div>
                )}
            </div>

            {/* Card Content */}
            <div className="p-4">
                {/* Trust Badge */}
                <div className="mb-2">
                    <TrustBadge trustLevel={deal.merchant.trustLevel} />
                </div>

                {/* Deal Title */}
                <h3 className="font-outfit text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                    {deal.title}
                </h3>

                {/* Merchant Name */}
                <p className="font-inter text-sm text-gray-600 mb-3">
                    {deal.merchant.name}
                </p>

                {/* Price and CTA */}
                <div className="flex items-center justify-between">
                    <span className="font-inter text-xl font-bold text-gray-900">
                        {formattedPrice}
                    </span>
                    <button
                        disabled={!isOnline}
                        title={!isOnline ? 'Available when online' : undefined}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isOnline
                                ? 'bg-vibrant-coral text-white hover:bg-vibrant-coral/90 cursor-pointer'
                                : 'bg-vibrant-coral/50 text-white cursor-not-allowed opacity-50'
                            }`}
                    >
                        Get Deal
                    </button>
                </div>
            </div>
        </Link>
    );
};
