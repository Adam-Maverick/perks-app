'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
}

interface CategoryFilterProps {
    categories: Category[];
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories }) => {
    const searchParams = useSearchParams();
    const activeCategory = searchParams.get('category');

    const allCategories = [
        { id: 'all', name: 'All', slug: '', icon: null },
        ...categories,
    ];

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {allCategories.map((category) => {
                const isActive = activeCategory === category.slug || (!activeCategory && category.slug === '');
                const href = category.slug ? `/dashboard/employee/marketplace?category=${category.slug}` : '/dashboard/employee/marketplace';

                return (
                    <Link
                        key={category.id}
                        href={href}
                        className={`
                            flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                            transition-colors duration-200 min-h-[44px]
                            ${isActive
                                ? 'bg-vibrant-coral text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                        `}
                        data-state={isActive ? 'active' : 'inactive'}
                    >
                        {category.icon && <span>{category.icon}</span>}
                        {category.name}
                    </Link>
                );
            })}
        </div>
    );
};
