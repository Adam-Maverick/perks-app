import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { transactions, escrowHolds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DisputeForm } from "@/components/modules/disputes/DisputeForm";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function DisputePage({ params }: PageProps) {
    const { userId } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }

    const { id } = await params;

    // Fetch transaction and escrow hold
    const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.id, id),
        with: {
            merchant: true,
            escrowHold: true,
        },
    });

    if (!transaction) {
        notFound();
    }

    // Authorization check
    if (transaction.userId !== userId) {
        redirect("/dashboard/employee");
    }

    const hold = transaction.escrowHold;

    // Validation: Must have escrow hold and be in HELD state
    if (!hold || hold.state !== "HELD") {
        redirect(`/dashboard/employee/transactions/${id}`);
    }

    // Ensure merchant exists (should be guaranteed by relation but good for type safety)
    if (!transaction.merchant) {
        return <div>Merchant not found</div>;
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <Link
                    href={`/dashboard/employee/transactions/${id}`}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Transaction
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900">Report an Issue</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Transaction with {transaction.merchant.name}
                    </p>
                </div>

                <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                Amount
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(transaction.amount)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                Date
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <DisputeForm escrowHoldId={hold.id} transactionId={transaction.id} />
                </div>
            </div>
        </div>
    );
}
