export const DealCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
            {/* Image Skeleton */}
            <div className="h-48 bg-gray-200" />

            {/* Content Skeleton */}
            <div className="p-4">
                {/* Badge Skeleton */}
                <div className="h-6 w-24 bg-gray-200 rounded-full mb-2" />

                {/* Title Skeleton */}
                <div className="h-6 bg-gray-200 rounded mb-2" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-1" />

                {/* Merchant Name Skeleton */}
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />

                {/* Price and Button Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="h-8 w-24 bg-gray-200 rounded" />
                    <div className="h-10 w-24 bg-gray-200 rounded-lg" />
                </div>
            </div>
        </div>
    );
};
