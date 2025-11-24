'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useLocation } from '@/hooks/useLocation';

function SearchBarContent({ initialQuery = '' }: { initialQuery?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(initialQuery);
    const debouncedQuery = useDebouncedValue(query, 300);

    const { city, state } = useLocation();

    // Sync local state with URL param on mount/update
    useEffect(() => {
        const urlQuery = searchParams.get('q') || '';
        if (urlQuery !== query) {
            setQuery(urlQuery);
        }
    }, [searchParams]);

    // Update URL when debounced query changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (debouncedQuery) {
            params.set('q', debouncedQuery);

            // Append location if available
            if (city) params.set('city', city);
            if (state) params.set('state', state);
        } else {
            params.delete('q');
            // We might want to keep location if just browsing, but for now let's keep it tied to search context
            // or maybe we should keep it? The AC says "If my location is set... local merchants are prioritized".
            // It implies location is always relevant. But let's follow the pattern:
            // If query is cleared, we usually just show all deals. 
            // Let's keep location params if they exist, or maybe clear them if search is cleared?
            // Actually, if I clear search, I go back to "all deals". 
            // Does "all deals" need location sorting? 
            // The searchDeals procedure handles location sorting. getDealsByCategory does NOT currently accept location.
            // So location is only for search results for now.
            params.delete('city');
            params.delete('state');
        }

        // Preserve other params like category
        router.push(`?${params.toString()}`, { scroll: false });
    }, [debouncedQuery, city, state, router, searchParams]);

    const handleClear = () => {
        setQuery('');
        const params = new URLSearchParams(searchParams.toString());
        params.delete('q');
        router.push(`?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                    className="h-5 w-5 text-electric-royal-blue"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric-royal-blue focus:border-transparent sm:text-base text-base transition-shadow duration-200 ease-in-out shadow-sm hover:shadow-md"
                placeholder="Search deals, merchants..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ fontSize: '16px' }} // Prevent iOS zoom
            />
            {query && (
                <button
                    onClick={handleClear}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-vibrant-coral transition-colors"
                    aria-label="Clear search"
                >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
        </div>
    );
}

export function SearchBar(props: { initialQuery?: string }) {
    return (
        <Suspense fallback={<div className="w-full max-w-md h-12 bg-gray-100 rounded-xl animate-pulse" />}>
            <SearchBarContent {...props} />
        </Suspense>
    );
}
