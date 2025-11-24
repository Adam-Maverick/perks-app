'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { DealCard } from './DealCard';

interface MarketplaceClientWrapperProps {
    deals: Array<{
        id: string;
        title: string;
        discountPercentage: number | null;
        originalPrice: number;
        merchant: {
            name: string;
            logoUrl: string | null;
            trustLevel: 'VERIFIED' | 'EMERGING';
        };
    }>;
}

export const MarketplaceClientWrapper: React.FC<MarketplaceClientWrapperProps> = ({ deals }) => {
    const { isOnline } = useOnlineStatus();

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} isOnline={isOnline} />
            ))}
        </div>
    );
};
