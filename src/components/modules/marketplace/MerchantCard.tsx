import Image from 'next/image';
import Link from 'next/link';
import { TrustBadge, TrustLevel } from './TrustBadge';

interface MerchantCardProps {
    id: string;
    name: string;
    logoUrl: string | null;
    trustLevel: TrustLevel;
    dealCount: number;
}

export const MerchantCard: React.FC<MerchantCardProps> = ({
    id,
    name,
    logoUrl,
    trustLevel,
    dealCount,
}) => {
    return (
        <Link
            href={`/dashboard/employee/marketplace/${id}`}
            className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-[#2563EB]/50 hover:shadow-md"
        >
            <div className="relative mb-4 h-32 w-full overflow-hidden rounded-lg bg-gray-50">
                {logoUrl ? (
                    <Image
                        src={logoUrl}
                        alt={name}
                        fill
                        className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-12 w-12"
                        >
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-outfit text-lg font-bold text-gray-900 group-hover:text-[#2563EB]">
                        {name}
                    </h3>
                </div>

                <div className="mb-2">
                    <TrustBadge trustLevel={trustLevel} />
                </div>

                <div className="mt-auto flex items-center gap-1.5 text-sm text-gray-600">
                    <span className="font-medium text-gray-900">{dealCount}</span>
                    <span>deals available</span>
                </div>
            </div>
        </Link>
    );
};
