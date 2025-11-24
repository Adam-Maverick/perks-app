'use client';

import Link from 'next/link';

interface EmptySearchStateProps {
    query: string;
}

export function EmptySearchState({ query }: EmptySearchStateProps) {
    // Simple keyword matching for suggestions
    const getSuggestions = (q: string) => {
        const lowerQ = q.toLowerCase();
        const suggestions = [];

        if (['pizza', 'burger', 'food', 'lunch', 'dinner', 'restaurant', 'eat'].some(k => lowerQ.includes(k))) {
            suggestions.push({ name: 'Food', slug: 'food' });
        }
        if (['uber', 'bolt', 'taxi', 'ride', 'transport', 'bus'].some(k => lowerQ.includes(k))) {
            suggestions.push({ name: 'Transport', slug: 'transport' });
        }
        if (['gym', 'fitness', 'health', 'doctor', 'hospital'].some(k => lowerQ.includes(k))) {
            suggestions.push({ name: 'Wellness', slug: 'wellness' });
        }
        if (['course', 'learn', 'study', 'school', 'book'].some(k => lowerQ.includes(k))) {
            suggestions.push({ name: 'Education', slug: 'education' });
        }
        if (['bill', 'electric', 'water', 'utility', 'power'].some(k => lowerQ.includes(k))) {
            suggestions.push({ name: 'Utilities', slug: 'utilities' });
        }

        // Default suggestions if no matches
        if (suggestions.length === 0) {
            suggestions.push(
                { name: 'Food', slug: 'food' },
                { name: 'Transport', slug: 'transport' }
            );
        }

        return suggestions.slice(0, 3); // Limit to 3
    };

    const suggestions = getSuggestions(query);

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-blue-50 p-4 rounded-full mb-4">
                <svg
                    className="h-10 w-10 text-electric-royal-blue"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 font-heading">
                No deals found for "{query}"
            </h3>

            <p className="text-gray-500 mb-8 max-w-sm">
                We couldn't find any deals matching your search. Try checking your spelling or browse by category.
            </p>

            <div className="space-y-3">
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Suggested Categories
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                    {suggestions.map((cat) => (
                        <Link
                            key={cat.slug}
                            href={`/dashboard/employee/marketplace?category=${cat.slug}`}
                            className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-electric-royal-blue hover:border-electric-royal-blue transition-colors"
                        >
                            {cat.name}
                        </Link>
                    ))}
                </div>
            </div>

            <Link
                href="/dashboard/employee/marketplace"
                className="mt-8 text-sm font-medium text-electric-royal-blue hover:text-blue-700"
            >
                Clear search and view all deals
            </Link>
        </div>
    );
}
