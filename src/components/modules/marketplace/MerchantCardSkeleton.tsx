import React from 'react';

export const MerchantCardSkeleton = () => {
    return (
        <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-4 h-32 w-full animate-pulse rounded-lg bg-gray-100" />
            <div className="flex flex-col gap-2">
                <div className="h-6 w-3/4 animate-pulse rounded bg-gray-100" />
                <div className="mb-2 h-5 w-24 animate-pulse rounded bg-gray-100" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
        </div>
    );
};
