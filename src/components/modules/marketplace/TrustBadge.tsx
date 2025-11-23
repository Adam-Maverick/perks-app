import React from 'react';

export type TrustLevel = 'VERIFIED' | 'EMERGING';

interface TrustBadgeProps {
    trustLevel: TrustLevel;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ trustLevel }) => {
    if (trustLevel === 'VERIFIED') {
        return (
            <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 border border-green-200">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                >
                    <path d="M20 6 9 17l-5-5" />
                </svg>
                Verified
            </div>
        );
    }

    if (trustLevel === 'EMERGING') {
        return (
            <div className="flex items-center gap-1.5 rounded-full bg-[#FA7921]/10 px-2.5 py-0.5 text-xs font-medium text-[#FA7921] border border-[#FA7921]/20">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
                Escrow Protected
            </div>
        );
    }

    return null;
};
