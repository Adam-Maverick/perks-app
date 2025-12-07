import { useQuery } from '@tanstack/react-query';
import { getWalletStatsAction } from '@/server/actions/wallet';

/**
 * Hook: useWalletStats (Story 5.3 AC: 3)
 *
 * Fetches wallet balance and trend for the current user.
 * Uses TanStack Query for caching and real-time updates.
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useWalletStats();
 * ```
 */
export function useWalletStats() {
    return useQuery({
        queryKey: ['wallet', 'stats'],
        queryFn: async () => {
            const result = await getWalletStatsAction();
            if (!result.success) {
                throw new Error(result.error || 'Failed to get wallet stats');
            }
            return result.data;
        },
        staleTime: 30 * 1000, // 30 seconds (more aggressive refresh for balance)
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true, // Refresh when user returns to tab
    });
}
