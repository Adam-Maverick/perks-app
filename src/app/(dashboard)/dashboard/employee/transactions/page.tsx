import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EscrowStatusBadge } from "@/components/modules/escrow/EscrowStatusBadge";
import Link from "next/link";
import { format } from "date-fns";

export default async function TransactionsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const userTransactions = await db.query.transactions.findMany({
        where: eq(transactions.userId, userId),
        with: {
            merchant: true,
            escrowHold: true,
        },
        orderBy: [desc(transactions.createdAt)],
        limit: 50,
    });

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-outfit font-bold mb-6">My Transactions</h1>

            {userTransactions.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                        <p>No transactions yet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {userTransactions.map((txn) => {
                        const amountInNaira = (txn.amount / 100).toLocaleString("en-NG", {
                            style: "currency",
                            currency: "NGN",
                        });

                        return (
                            <Link key={txn.id} href={`/dashboard/employee/transactions/${txn.id}`}>
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{txn.description}</CardTitle>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {txn.merchant?.name}
                                                </p>
                                            </div>
                                            {txn.escrowHold && (
                                                <EscrowStatusBadge status={txn.escrowHold.state} />
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center">
                                            <span className="text-2xl font-semibold">{amountInNaira}</span>
                                            <span className="text-sm text-gray-500">
                                                {format(txn.createdAt, "MMM d, yyyy")}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
