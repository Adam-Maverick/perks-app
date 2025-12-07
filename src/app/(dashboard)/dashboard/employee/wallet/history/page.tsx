import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { walletTransactions, wallets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, RefreshCw } from "lucide-react";

/**
 * Wallet History Page (Story 5.3 AC: 4)
 *
 * Displays the transaction history for the employee's wallet.
 */

// Format kobo to Naira
function formatNaira(kobo: number): string {
    const naira = kobo / 100;
    return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format date
function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

// Transaction type icon and color
function getTransactionStyle(type: string) {
    switch (type) {
        case 'DEPOSIT':
            return { icon: ArrowDownCircle, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Deposit' };
        case 'SPEND':
            return { icon: ArrowUpCircle, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Spend' };
        case 'REFUND':
            return { icon: RefreshCw, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Refund' };
        default:
            return { icon: RefreshCw, color: 'text-gray-600', bgColor: 'bg-gray-50', label: type };
    }
}

export default async function WalletHistoryPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Get wallet for user
    const wallet = await db.query.wallets.findFirst({
        where: eq(wallets.userId, userId),
    });

    // Get transactions if wallet exists
    let transactions: (typeof walletTransactions.$inferSelect)[] = [];
    if (wallet) {
        transactions = await db.query.walletTransactions.findMany({
            where: eq(walletTransactions.walletId, wallet.id),
            orderBy: [desc(walletTransactions.createdAt)],
            limit: 50,
        });
    }

    return (
        <div className="min-h-screen bg-clean-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link
                        href="/dashboard/employee"
                        className="text-gray-500 hover:text-electric-royal-blue transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="font-outfit text-xl font-bold text-gray-900">
                        Wallet History
                    </h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Balance Summary */}
                {wallet && (
                    <div className="bg-electric-royal-blue rounded-xl p-6 text-white mb-8">
                        <p className="font-inter text-sm opacity-80 mb-1">Current Balance</p>
                        <p className="font-outfit text-4xl font-bold">{formatNaira(wallet.balance)}</p>
                    </div>
                )}

                {/* No Wallet State */}
                {!wallet && (
                    <div className="bg-gray-50 rounded-xl p-8 text-center mb-8">
                        <p className="font-inter text-gray-600">
                            No wallet found. Your employer needs to fund your stipend first.
                        </p>
                    </div>
                )}

                {/* Transaction List */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="font-outfit text-lg font-semibold text-gray-900">
                            Recent Transactions
                        </h2>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="font-inter text-gray-500">No transactions yet.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {transactions.map((tx) => {
                                const style = getTransactionStyle(tx.type);
                                const Icon = style.icon;
                                const isCredit = tx.type === 'DEPOSIT' || tx.type === 'REFUND';

                                return (
                                    <li key={tx.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full ${style.bgColor} flex items-center justify-center`}>
                                                <Icon className={`w-5 h-5 ${style.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-inter font-medium text-gray-900 truncate">
                                                    {tx.description || style.label}
                                                </p>
                                                <p className="font-inter text-sm text-gray-500">
                                                    {formatDate(tx.createdAt)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-outfit font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isCredit ? '+' : '-'}{formatNaira(tx.amount)}
                                                </p>
                                                <p className="font-inter text-xs text-gray-400 uppercase">
                                                    {tx.status}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
}
