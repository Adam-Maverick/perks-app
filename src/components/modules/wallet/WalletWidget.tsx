'use client';

/**
 * WalletWidget (Story 5.3)
 *
 * Displays wallet balance with trend indicator on the employee dashboard.
 * Uses TanStack Query for real-time updates.
 *
 * ACs covered:
 * - AC1: Wallet Widget Display (balance in Naira)
 * - AC2: Trend Indicator (percentage + direction)
 * - AC3: Real-time Updates (via useWalletStats hook)
 * - AC4: Transaction History Link (click navigates to /dashboard/employee/wallet/history)
 * - AC5: Low Balance Alert (< ₦1,000)
 * - AC6: Visual Design (Electric Royal Blue #2563EB)
 */

import Link from 'next/link';
import { useWalletStats } from '@/hooks/queries/use-wallet';
import { TrendingUp, TrendingDown, Minus, Wallet, AlertTriangle } from 'lucide-react';

// Low balance threshold in kobo (₦1,000 = 100,000 kobo)
const LOW_BALANCE_THRESHOLD = 100000;

/**
 * Format kobo amount to Naira display string.
 * Example: 1250000 -> "₦12,500"
 */
function formatNaira(kobo: number): string {
    const naira = kobo / 100;
    return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function WalletWidget() {
    const { data: stats, isLoading, error } = useWalletStats();

    // Loading state with skeleton
    if (isLoading) {
        return (
            <div className="bg-electric-royal-blue rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        <span className="font-inter text-sm opacity-80">Wallet Balance</span>
                    </div>
                </div>
                <div className="space-y-3 animate-pulse">
                    <div className="h-8 bg-white/20 rounded w-3/4"></div>
                    <div className="h-4 bg-white/20 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !stats) {
        return (
            <div className="bg-electric-royal-blue/80 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        <span className="font-inter text-sm opacity-80">Wallet Balance</span>
                    </div>
                </div>
                <p className="font-inter text-sm opacity-80">Unable to load wallet</p>
            </div>
        );
    }

    const { balance, trend } = stats;
    const isLowBalance = balance < LOW_BALANCE_THRESHOLD;

    // Trend icon based on direction
    const TrendIcon = trend.direction === 'up' ? TrendingUp :
        trend.direction === 'down' ? TrendingDown :
            Minus;

    // Trend color
    const trendColorClass = trend.direction === 'up' ? 'text-electric-lime' :
        trend.direction === 'down' ? 'text-vibrant-coral' :
            'text-white/60';

    return (
        <Link
            href="/dashboard/employee/wallet/history"
            className="block bg-electric-royal-blue rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    <span className="font-inter text-sm opacity-80">Wallet Balance</span>
                </div>
                <span className="font-inter text-xs opacity-60 group-hover:opacity-100 transition-opacity">
                    View History →
                </span>
            </div>

            {/* Balance */}
            <div className="mb-4">
                <p className="font-outfit text-3xl font-bold">
                    {formatNaira(balance)}
                </p>
            </div>

            {/* Trend Indicator */}
            <div className="flex items-center gap-2 mb-4">
                <TrendIcon className={`w-4 h-4 ${trendColorClass}`} />
                <span className={`font-inter text-sm ${trendColorClass}`}>
                    {trend.label}
                </span>
            </div>

            {/* Low Balance Alert (AC5) */}
            {isLowBalance && (
                <div className="flex items-center gap-2 p-3 bg-vibrant-coral/20 rounded-lg border border-vibrant-coral/30">
                    <AlertTriangle className="w-4 h-4 text-vibrant-coral" />
                    <span className="font-inter text-xs text-vibrant-coral">
                        Ask your employer to top up your stipend
                    </span>
                </div>
            )}
        </Link>
    );
}
