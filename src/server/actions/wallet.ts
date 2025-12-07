'use server';

/**
 * Wallet Server Actions (Story 5.3)
 *
 * Server actions for fetching wallet data from client components.
 */

import { getWalletStats, WalletStats } from '@/server/procedures/wallet';
import { auth } from '@clerk/nextjs/server';

type ActionResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
};

/**
 * Server Action: Get wallet stats for the current user.
 * Used by TanStack Query for client-side data fetching (AC: 3).
 *
 * @returns WalletStats or error
 */
export async function getWalletStatsAction(): Promise<ActionResponse<WalletStats>> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        const stats = await getWalletStats(userId);

        return {
            success: true,
            data: stats,
        };
    } catch (error) {
        console.error('getWalletStatsAction error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get wallet stats',
        };
    }
}
